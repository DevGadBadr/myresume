import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { chatRefineDraft } from '@/lib/ai/openai';
import {
  normalizeIncomingDraftTemplate,
  readOptionalString,
  readRequiredString,
} from '@/lib/ai/request';
import { readSummary } from '@/lib/ai/resume-tools';
import type { AiChatMessage } from '@/lib/ai/types';
import { getResumeData } from '@/lib/resume-store';
import { ResumeValidationError } from '@/lib/resume-validation';

function readMessages(value: unknown): AiChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ResumeValidationError('messages must be a non-empty array');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new ResumeValidationError(`messages[${index}] must be an object`);
    }
    const record = item as Record<string, unknown>;
    if (record.role !== 'user' && record.role !== 'assistant') {
      throw new ResumeValidationError(`messages[${index}].role must be user or assistant`);
    }
    if (typeof record.content !== 'string' || !record.content.trim()) {
      throw new ResumeValidationError(`messages[${index}].content is required`);
    }
    return { role: record.role, content: record.content.trim() };
  });
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const jobTitle = readRequiredString(body?.jobTitle, 'jobTitle');
    const jobDescription = readRequiredString(body?.jobDescription, 'jobDescription');
    const company = readOptionalString(body?.company);
    const messages = readMessages(body?.messages);

    if (body?.draftTemplate === undefined) {
      throw new ResumeValidationError('draftTemplate is required');
    }

    const library = await getResumeData();
    const draftTemplate = normalizeIncomingDraftTemplate(library, body.draftTemplate);
    const summary =
      body?.summary !== undefined ? readSummary(body.summary) : undefined;

    const result = await chatRefineDraft({
      jobTitle,
      company,
      jobDescription,
      draftTemplate,
      messages,
      summary,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ResumeValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'INVALID_AI_REQUEST' },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : 'Failed to refine tailored resume';
    if (message.startsWith('Missing required environment variable:')) {
      return NextResponse.json({ error: message, code: 'MISSING_OPENAI_ENV' }, { status: 500 });
    }

    console.error('POST /api/ai/chat error:', err);
    return NextResponse.json({ error: message, code: 'AI_CHAT_FAILED' }, { status: 500 });
  }
}
