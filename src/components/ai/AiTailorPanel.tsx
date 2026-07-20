'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ResumeData, ResumeTemplate } from '@/types/resume';
import { APP_BASE_PATH } from '@/lib/config';
import type { AiChatMessage, AiGenerateResponse, AiTailorSummary } from '@/lib/ai/types';
import { withUniqueSavedName } from '@/lib/ai/variant-naming';
import { assembleTemplateResume } from '@/lib/template-content';
import ResumeFlowDocument from '@/components/ResumeFlowDocument';
import { EditModeContext } from '@/context/EditModeContext';

interface AiTailorPanelProps {
  data: ResumeData;
  onChange: React.Dispatch<React.SetStateAction<ResumeData>>;
  onSavedToResumes: (templateId: string) => void;
}

type PanelStatus = 'idle' | 'generating' | 'chatting' | 'error';

function emptySummary(): AiTailorSummary {
  return {
    overview: '',
    contentAdded: [],
    libraryProposals: [],
    gaps: [],
    keywordFocus: [],
  };
}

export default function AiTailorPanel({ data, onChange, onSavedToResumes }: AiTailorPanelProps) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [draftTemplate, setDraftTemplate] = useState<ResumeTemplate | null>(null);
  const [summary, setSummary] = useState<AiTailorSummary>(emptySummary());
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [saveChecked, setSaveChecked] = useState(false);
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  const previewData = useMemo(() => {
    if (!draftTemplate) {
      return null;
    }
    return assembleTemplateResume(data, draftTemplate);
  }, [data, draftTemplate]);

  const discardDraft = useCallback(() => {
    setDraftTemplate(null);
    setSummary(emptySummary());
    setMessages([]);
    setChatInput('');
    setSaveChecked(false);
    setSavedTemplateId(null);
    setError(null);
    setStatus('idle');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Job title and job description are required.');
      setStatus('error');
      return;
    }

    setStatus('generating');
    setError(null);
    setSavedTemplateId(null);

    try {
      const response = await fetch(`${APP_BASE_PATH}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim() || undefined,
          jobDescription: jobDescription.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (AiGenerateResponse & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to generate tailored resume');
      }

      if (!payload?.draftTemplate) {
        throw new Error('Generate response missing draftTemplate');
      }

      setDraftTemplate(payload.draftTemplate);
      setSummary(payload.summary ?? emptySummary());
      setMessages([
        {
          role: 'assistant',
          content:
            payload.summary?.overview?.trim() ||
            'Draft ready. Review the summary, then ask for refinements if needed.',
        },
      ]);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to generate tailored resume');
    }
  }, [company, jobDescription, jobTitle, notes]);

  const handleChat = useCallback(async () => {
    if (!draftTemplate || !chatInput.trim()) {
      return;
    }

    const userMessage: AiChatMessage = { role: 'user', content: chatInput.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setChatInput('');
    setStatus('chatting');
    setError(null);

    try {
      const response = await fetch(`${APP_BASE_PATH}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim() || undefined,
          jobDescription: jobDescription.trim(),
          draftTemplate,
          messages: nextMessages,
          summary,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            draftTemplate?: ResumeTemplate;
            assistantMessage?: string;
            summary?: AiTailorSummary;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to refine resume');
      }

      if (!payload?.draftTemplate) {
        throw new Error('Chat response missing draftTemplate');
      }

      setDraftTemplate(payload.draftTemplate);
      if (payload.summary) {
        setSummary(payload.summary);
      }
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: payload.assistantMessage?.trim() || 'Updated the draft.',
        },
      ]);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to refine resume');
    }
  }, [
    chatInput,
    company,
    draftTemplate,
    jobDescription,
    jobTitle,
    messages,
    summary,
  ]);

  const handleSave = useCallback(() => {
    if (!draftTemplate || !saveChecked) {
      return;
    }

    const uniqueDraft = withUniqueSavedName(draftTemplate, data.templates);
    onChange((current) => ({
      ...current,
      templates: [...current.templates, uniqueDraft],
      activeTemplateId: uniqueDraft.id,
    }));
    setDraftTemplate(uniqueDraft);
    setSavedTemplateId(uniqueDraft.id);
    onSavedToResumes(uniqueDraft.id);
  }, [data.templates, draftTemplate, onChange, onSavedToResumes, saveChecked]);

  const busy = status === 'generating' || status === 'chatting';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <aside className="no-print space-y-4 rounded border border-[var(--resume-border)] bg-[var(--resume-panel)] p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-[var(--resume-text)]">AI Tailor</h2>
          <p className="mt-1 text-xs text-[var(--resume-muted)]">
            Paste a job description. We tailor a new resume variant from your library. Nothing is
            saved until you check Save.
          </p>
        </div>

        <label className="block text-xs font-semibold text-[var(--resume-muted)]">
          Job title
          <input
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            disabled={busy}
            className="mt-1 w-full rounded border border-[var(--resume-border)] bg-transparent px-2 py-1.5 text-sm font-normal text-[var(--resume-text)]"
            placeholder="Backend Engineer"
          />
        </label>

        <label className="block text-xs font-semibold text-[var(--resume-muted)]">
          Company (optional)
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            disabled={busy}
            className="mt-1 w-full rounded border border-[var(--resume-border)] bg-transparent px-2 py-1.5 text-sm font-normal text-[var(--resume-text)]"
            placeholder="Acme"
          />
        </label>

        <label className="block text-xs font-semibold text-[var(--resume-muted)]">
          Job description
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            disabled={busy}
            rows={10}
            className="mt-1 w-full rounded border border-[var(--resume-border)] bg-transparent px-2 py-1.5 text-sm font-normal text-[var(--resume-text)]"
            placeholder="Paste the full job description…"
          />
        </label>

        <label className="block text-xs font-semibold text-[var(--resume-muted)]">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={busy}
            rows={2}
            className="mt-1 w-full rounded border border-[var(--resume-border)] bg-transparent px-2 py-1.5 text-sm font-normal text-[var(--resume-text)]"
            placeholder="Prefer backend bullets; keep to 2 pages…"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            className="rounded bg-[var(--resume-text)] px-3 py-1.5 text-xs text-[var(--resume-paper)] disabled:opacity-50"
          >
            {status === 'generating' ? 'Generating…' : draftTemplate ? 'Regenerate' : 'Generate'}
          </button>
          {draftTemplate && (
            <button
              type="button"
              onClick={discardDraft}
              disabled={busy}
              className="rounded border border-[var(--resume-border)] px-3 py-1.5 text-xs text-[var(--resume-text)] disabled:opacity-50"
            >
              Discard draft
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {draftTemplate && (
          <>
            <section className="space-y-2 border-t border-[var(--resume-border)] pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--resume-muted)]">
                Review summary
              </h3>
              {summary.overview && (
                <p className="text-sm text-[var(--resume-text)]">{summary.overview}</p>
              )}
              {summary.keywordFocus.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--resume-muted)]">Keyword focus</p>
                  <p className="text-xs text-[var(--resume-text)]">{summary.keywordFocus.join(', ')}</p>
                </div>
              )}
              {summary.contentAdded.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--resume-muted)]">Content added</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[var(--resume-text)]">
                    {summary.contentAdded.map((item, index) => (
                      <li key={`${item.where}-${index}`}>
                        <span className="font-medium">{item.where}:</span> {item.text}
                        {item.reason ? ` — ${item.reason}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.libraryProposals.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--resume-muted)]">
                    Library proposals
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[var(--resume-text)]">
                    {summary.libraryProposals.map((item, index) => (
                      <li key={`${item.targetHint}-${index}`}>
                        <span className="font-medium">{item.targetHint}:</span> {item.suggestedText}
                        {item.reason ? ` — ${item.reason}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.gaps.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--resume-muted)]">Gaps</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[var(--resume-text)]">
                    {summary.gaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="space-y-2 border-t border-[var(--resume-border)] pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--resume-muted)]">
                Refine with chat
              </h3>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-[var(--resume-border)] p-2">
                {messages.map((message, index) => (
                  <p
                    key={`${message.role}-${index}`}
                    className={`text-xs ${
                      message.role === 'user'
                        ? 'text-[var(--resume-text)]'
                        : 'text-[var(--resume-muted)]'
                    }`}
                  >
                    <span className="font-semibold">
                      {message.role === 'user' ? 'You' : 'AI'}:
                    </span>{' '}
                    {message.content}
                  </p>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  disabled={busy}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleChat();
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-[var(--resume-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--resume-text)]"
                  placeholder="Emphasize NestJS in the latest role…"
                />
                <button
                  type="button"
                  onClick={() => void handleChat()}
                  disabled={busy || !chatInput.trim()}
                  className="rounded border border-[var(--resume-border)] px-3 py-1.5 text-xs text-[var(--resume-text)] disabled:opacity-50"
                >
                  {status === 'chatting' ? '…' : 'Send'}
                </button>
              </div>
            </section>

            <section className="space-y-2 border-t border-[var(--resume-border)] pt-4">
              <label className="flex items-center gap-2 text-sm text-[var(--resume-text)]">
                <input
                  type="checkbox"
                  checked={saveChecked}
                  onChange={(event) => setSaveChecked(event.target.checked)}
                  disabled={busy || Boolean(savedTemplateId)}
                />
                Save resume variant
              </label>
              <p className="text-[11px] text-[var(--resume-subtle)]">
                Unchecked by default (generate and forget). Check this, then Save, to keep the
                variant under Resumes.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busy || !saveChecked || Boolean(savedTemplateId)}
                  className="rounded bg-[var(--resume-text)] px-3 py-1.5 text-xs text-[var(--resume-paper)] disabled:opacity-50"
                >
                  {savedTemplateId ? 'Saved' : 'Save'}
                </button>
                {savedTemplateId && (
                  <button
                    type="button"
                    onClick={() => onSavedToResumes(savedTemplateId)}
                    className="rounded border border-[var(--resume-border)] px-3 py-1.5 text-xs text-[var(--resume-text)]"
                  >
                    Open in Resumes
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[var(--resume-muted)]">
                Draft name: <span className="font-medium text-[var(--resume-text)]">{draftTemplate.name}</span>
              </p>
            </section>
          </>
        )}
      </aside>

      <div>
        {previewData ? (
          <EditModeContext.Provider value={{ isEditing: false, toggle: () => undefined }}>
            <ResumeFlowDocument
              data={previewData}
              onChange={() => undefined}
              showPageGaps
              showShadow
              layoutId={previewData.layoutId}
            />
          </EditModeContext.Provider>
        ) : (
          <div className="flex min-h-[480px] items-center justify-center rounded border border-dashed border-[var(--resume-border)] bg-[var(--resume-panel)] p-8 text-center text-sm text-[var(--resume-muted)]">
            Generate a tailored draft to preview it here. Layout starts from your library and can be
            edited after you save the variant.
          </div>
        )}
      </div>
    </div>
  );
}
