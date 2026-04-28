'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ResumeData } from '@/types/resume';
import { EditModeContext } from '@/context/EditModeContext';
import { APP_BASE_PATH, RESUME_DRAFT_STORAGE_KEY, RESUME_THEME_STORAGE_KEY } from '@/lib/config';
import { PAGE_WIDTH_MM } from '@/lib/page-layout';
import { tryNormalizeResumeData } from '@/lib/resume-validation';
import { DEFAULT_COLOR_THEME, normalizeColorTheme, type ColorTheme } from '@/lib/theme';
import OnlineResume from '@/components/OnlineResume';
import TemplateEditor from '@/components/TemplateEditor';
import { DEFAULT_TEMPLATE_ID } from '@/lib/resume-template';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
type WorkspaceMode = 'main' | 'templates';

interface EditorShellProps {
  initialData: ResumeData;
  canEdit: boolean;
}

function formatSavedAt(savedAt: string | null) {
  if (!savedAt) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(savedAt));
  } catch {
    return null;
  }
}

export default function EditorShell({ initialData, canEdit }: EditorShellProps) {
  const router = useRouter();
  const [data, setData] = useState<ResumeData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('main');
  const [activeTemplateId, setActiveTemplateId] = useState(
    initialData.activeTemplateId ?? initialData.templates[0]?.id ?? DEFAULT_TEMPLATE_ID
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const [theme, setTheme] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  const skipNextAutosaveRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveSequenceRef = useRef(0);
  const resetStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(initialData);
    setActiveTemplateId(initialData.activeTemplateId ?? initialData.templates[0]?.id ?? DEFAULT_TEMPLATE_ID);
  }, [initialData]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(RESUME_THEME_STORAGE_KEY);
    setTheme(normalizeColorTheme(storedTheme));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(RESUME_THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!canEdit) {
      setAutosaveReady(false);
      setIsEditing(false);
      return;
    }

    const storedDraft = window.localStorage.getItem(RESUME_DRAFT_STORAGE_KEY);
    if (storedDraft) {
      try {
        const parsed = JSON.parse(storedDraft) as { data?: unknown; updatedAt?: string };
        const normalizedDraft = tryNormalizeResumeData(parsed.data);
        if (normalizedDraft.ok) {
          setData(normalizedDraft.data);
          setActiveTemplateId(
            normalizedDraft.data.activeTemplateId ??
              normalizedDraft.data.templates[0]?.id ??
              DEFAULT_TEMPLATE_ID
          );
          setSaveStatus('dirty');
          setLastSavedAt(parsed.updatedAt ?? null);
        } else {
          window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);
      }
    }

    setAutosaveReady(true);
  }, [canEdit]);

  useEffect(() => {
    if (!canEdit || !autosaveReady) {
      return;
    }

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    window.localStorage.setItem(
      RESUME_DRAFT_STORAGE_KEY,
      JSON.stringify({ data, updatedAt: new Date().toISOString() })
    );

    setSaveStatus((current) => (current === 'saving' ? current : 'dirty'));
    setSaveError(null);

    const saveTimer = window.setTimeout(async () => {
      const requestSequence = ++saveSequenceRef.current;
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setSaveStatus('saving');

      try {
        const response = await fetch(`${APP_BASE_PATH}/api/resume`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => null)) as
          | { savedAt?: string; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Failed to save resume');
        }

        if (requestSequence !== saveSequenceRef.current) {
          return;
        }

        setSaveStatus('saved');
        setLastSavedAt(payload?.savedAt ?? new Date().toISOString());
        window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);

        if (resetStatusTimerRef.current) {
          clearTimeout(resetStatusTimerRef.current);
        }

        resetStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSaveStatus('error');
        setSaveError(error instanceof Error ? error.message : 'Failed to save resume');
      }
    }, 1000);

    return () => {
      clearTimeout(saveTimer);
    };
  }, [autosaveReady, canEdit, data]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus === 'dirty' || saveStatus === 'saving' || saveStatus === 'error') {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [canEdit, saveStatus]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (resetStatusTimerRef.current) {
        clearTimeout(resetStatusTimerRef.current);
      }
    };
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (pdfLoading) {
      return;
    }

    setPdfLoading(true);
    try {
      const templateId = workspaceMode === 'templates' ? activeTemplateId : DEFAULT_TEMPLATE_ID;
      const templateName =
        data.templates.find((template) => template.id === templateId)?.name ?? 'resume';
      const res = await fetch(`${APP_BASE_PATH}/api/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, theme }),
      });
      if (!res.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error(error);
      window.alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, [activeTemplateId, data.templates, pdfLoading, theme, workspaceMode]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const response = await fetch(`${APP_BASE_PATH}/api/auth/logout`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert('Logout failed. Please try again.');
    } finally {
      setLogoutLoading(false);
    }
  }, [router]);

  const savedAtLabel = formatSavedAt(lastSavedAt);
  const editEnabled = canEdit && isEditing;
  const shellMaxWidth =
    workspaceMode === 'templates'
      ? 'min(100%, 1320px)'
      : `calc(${PAGE_WIDTH_MM}mm + 8rem)`;

  const handleActiveTemplateChange = useCallback(
    (templateId: string) => {
      setActiveTemplateId(templateId);
      setData((current) => ({ ...current, activeTemplateId: templateId }));
    },
    []
  );

  return (
    <EditModeContext.Provider
      value={{ isEditing: editEnabled, toggle: () => setIsEditing((value) => !value) }}
    >
      <div className="no-print sticky top-0 z-50 border-b border-[var(--resume-border)] bg-[var(--resume-panel)] shadow-sm">
        <div
          className="mx-auto flex items-center justify-between gap-3 px-6 py-2"
          style={{ maxWidth: `calc(${PAGE_WIDTH_MM}mm + 2rem)` }}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--resume-muted)]">
              Engineer Gad Badr Resume
            </span>
            {savedAtLabel && (
              <p className="text-[11px] text-[var(--resume-subtle)]">Last saved {savedAtLabel}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveStatus !== 'idle' && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium transition-all ${
                  saveStatus === 'saving'
                    ? 'bg-yellow-100 text-yellow-700'
                    : saveStatus === 'saved'
                      ? 'bg-green-100 text-green-700'
                      : saveStatus === 'dirty'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-red-100 text-red-700'
                }`}
              >
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                    ? 'Saved'
                    : saveStatus === 'dirty'
                      ? 'Unsaved changes'
                      : 'Save failed'}
              </span>
            )}

            {saveError && <span className="text-xs text-red-600">{saveError}</span>}

            {canEdit && (
              <div className="flex rounded border border-[var(--resume-border)] p-0.5">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('main')}
                  className={`rounded px-2 py-1 text-xs ${
                    workspaceMode === 'main' ? 'bg-[var(--resume-text)] text-[var(--resume-paper)]' : 'text-[var(--resume-muted)]'
                  }`}
                >
                  Main
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('templates')}
                  className={`rounded px-2 py-1 text-xs ${
                    workspaceMode === 'templates' ? 'bg-[var(--resume-text)] text-[var(--resume-paper)]' : 'text-[var(--resume-muted)]'
                  }`}
                >
                  Templates
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="rounded border border-[var(--resume-border)] px-3 py-1.5 text-xs text-[var(--resume-text)] transition-colors hover:bg-[var(--resume-hover)]"
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 rounded bg-[var(--resume-text)] px-3 py-1.5 text-xs text-[var(--resume-paper)] transition-colors hover:opacity-85 disabled:opacity-50"
            >
              {pdfLoading
                ? 'Generating...'
                : workspaceMode === 'templates'
                  ? 'Download Template PDF'
                  : 'Download PDF'}
            </button>

            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing((value) => !value)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    editEnabled
                      ? 'bg-[#8B0000] text-white hover:bg-[#6b0000]'
                      : 'border border-[#8B000040] bg-[#8B000015] text-[#8B0000] hover:bg-[#8B000025]'
                  }`}
                >
                  {editEnabled ? 'Done Editing' : 'Edit Resume'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="rounded border border-[var(--resume-border)] px-3 py-1.5 text-xs text-[var(--resume-text)] transition-colors hover:bg-[var(--resume-hover)] disabled:opacity-50"
                >
                  {logoutLoading ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded border border-[var(--resume-border)] px-3 py-1.5 text-xs text-[var(--resume-text)] transition-colors hover:bg-[var(--resume-hover)]"
              >
                Owner login
              </Link>
            )}
          </div>
        </div>

        {editEnabled && <div className="h-0.5 w-full bg-[#8B0000]" />}
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: shellMaxWidth }}>
        {workspaceMode === 'templates' && canEdit ? (
          <TemplateEditor
            data={data}
            activeTemplateId={activeTemplateId}
            onActiveTemplateChange={handleActiveTemplateChange}
            onChange={setData}
          />
        ) : (
          <OnlineResume data={data} onChange={setData} />
        )}

        <p className="no-print mt-4 text-center text-xs text-[var(--resume-subtle)]">
          {canEdit
            ? 'Authenticated edits are auto-saved to MongoDB, with local draft recovery on failure.'
            : 'Read-only mode. Sign in as the owner to edit this resume.'}
        </p>
      </div>
    </EditModeContext.Provider>
  );
}
