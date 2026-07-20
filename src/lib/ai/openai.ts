import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { getOpenAiEnv } from '@/lib/env';
import { compactDraftTemplate, compactLibrary, truncateJobDescription } from '@/lib/ai/compact-resume';
import {
  AI_GENERATE_JSON_INSTRUCTION,
  AI_TAILOR_SYSTEM_PROMPT,
} from '@/lib/ai/system-prompt';
import {
  RESUME_TOOL_DEFINITIONS,
  applyGenerateOutput,
  applyResumeTool,
  cloneTemplate,
  parseGenerateModelOutput,
  readSummary,
} from '@/lib/ai/resume-tools';
import type {
  AiChatMessage,
  AiGenerateModelOutput,
  AiTailorSummary,
} from '@/lib/ai/types';
import { createDraftTemplateFromLibrary } from '@/lib/ai/draft-factory';
import type { ResumeData, ResumeTemplate } from '@/types/resume';

const MAX_CHAT_STEPS = 4;
const MAX_CHAT_HISTORY_TURNS = 6;

let client: OpenAI | null = null;

function getClient() {
  if (client) {
    return client;
  }
  const { OPENAI_API_KEY } = getOpenAiEnv();
  client = new OpenAI({ apiKey: OPENAI_API_KEY });
  return client;
}

function getModel() {
  return getOpenAiEnv().OPENAI_MODEL;
}

export { createDraftTemplateFromLibrary };

export async function generateTailoredDraft(params: {
  library: ResumeData;
  jobTitle: string;
  company?: string;
  jobDescription: string;
  notes?: string;
}): Promise<{ draftTemplate: ResumeTemplate; summary: AiTailorSummary }> {
  const base = createDraftTemplateFromLibrary(params.library, params.jobTitle, params.company);
  const compact = compactLibrary(params.library);
  const userPayload = {
    jobTitle: params.jobTitle.trim(),
    company: params.company?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    jobDescription: truncateJobDescription(params.jobDescription),
    library: compact,
  };

  const completion = await getClient().chat.completions.create({
    model: getModel(),
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${AI_TAILOR_SYSTEM_PROMPT}\n\n${AI_GENERATE_JSON_INSTRUCTION}` },
      {
        role: 'user',
        content: `Tailor a resume variant for this job using the library.\n\n${JSON.stringify(userPayload)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty generate response');
  }

  const modelOutput = parseGenerateModelOutput(content);
  const { template, summary } = applyGenerateOutput(base, modelOutput);
  return { draftTemplate: template, summary };
}

function capChatHistory(messages: AiChatMessage[]): AiChatMessage[] {
  if (messages.length <= MAX_CHAT_HISTORY_TURNS) {
    return messages;
  }
  return messages.slice(-MAX_CHAT_HISTORY_TURNS);
}

function mergeSummaryPatch(
  current: AiTailorSummary | undefined,
  patch: unknown
): AiTailorSummary | undefined {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return current;
  }
  const parsed = readSummary(patch);
  if (!current) {
    return parsed;
  }
  return {
    overview: parsed.overview || current.overview,
    contentAdded: [...current.contentAdded, ...parsed.contentAdded],
    libraryProposals: [...current.libraryProposals, ...parsed.libraryProposals],
    gaps: Array.from(new Set([...current.gaps, ...parsed.gaps])),
    keywordFocus: Array.from(new Set([...current.keywordFocus, ...parsed.keywordFocus])),
  };
}

export async function chatRefineDraft(params: {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  draftTemplate: ResumeTemplate;
  messages: AiChatMessage[];
  summary?: AiTailorSummary;
}): Promise<{
  draftTemplate: ResumeTemplate;
  assistantMessage: string;
  summary?: AiTailorSummary;
}> {
  let draft = cloneTemplate(params.draftTemplate);
  let summary = params.summary;

  const contextBlock = {
    jobTitle: params.jobTitle.trim(),
    company: params.company?.trim() || undefined,
    jobDescription: truncateJobDescription(params.jobDescription, 4000),
    draft: compactDraftTemplate(draft),
  };

  const history = capChatHistory(params.messages);
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${AI_TAILOR_SYSTEM_PROMPT}

Use the provided tools to edit the draft. Prefer small patches.
When you add soft skills or non-library phrasing, mention them in your reply and include a JSON summaryPatch object in a final tool-free message only if needed — otherwise describe changes briefly.
Current job + draft context (compact JSON):\n${JSON.stringify(contextBlock)}`,
    },
    ...history.map(
      (message): ChatCompletionMessageParam => ({
        role: message.role,
        content: message.content,
      })
    ),
  ];

  const tools = RESUME_TOOL_DEFINITIONS as ChatCompletionTool[];
  let assistantMessage = '';

  for (let step = 0; step < MAX_CHAT_STEPS; step += 1) {
    const completion = await getClient().chat.completions.create({
      model: getModel(),
      temperature: 0.3,
      messages,
      tools,
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    const message = choice?.message;
    if (!message) {
      throw new Error('OpenAI returned an empty chat response');
    }

    messages.push(message);

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      assistantMessage = message.content?.trim() || 'Updated the draft.';
      // Optional trailing summaryPatch JSON block detection
      const patchMatch = assistantMessage.match(/summaryPatch\s*[:=]\s*(\{[\s\S]*\})/i);
      if (patchMatch) {
        try {
          summary = mergeSummaryPatch(summary, JSON.parse(patchMatch[1]));
        } catch {
          // ignore malformed patch
        }
      }
      break;
    }

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') {
        continue;
      }
      let args: unknown = {};
      try {
        args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      } catch {
        args = {};
      }

      try {
        const applied = applyResumeTool(draft, toolCall.function.name, args);
        draft = applied.template;
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(applied.result),
        });
      } catch (error) {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: error instanceof Error ? error.message : 'Tool failed',
          }),
        });
      }
    }

    if (step === MAX_CHAT_STEPS - 1) {
      assistantMessage = message.content?.trim() || 'Applied the requested edits to the draft.';
    }
  }

  if (!assistantMessage) {
    assistantMessage = 'Applied the requested edits to the draft.';
  }

  return { draftTemplate: draft, assistantMessage, summary };
}

export type { AiGenerateModelOutput };
