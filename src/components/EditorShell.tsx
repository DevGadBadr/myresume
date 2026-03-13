'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  CertEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
} from '@/types/resume';
import { EditModeContext } from '@/context/EditModeContext';
import { APP_BASE_PATH, RESUME_DRAFT_STORAGE_KEY } from '@/lib/config';
import { tryNormalizeResumeData } from '@/lib/resume-validation';
import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const skipNextAutosaveRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveSequenceRef = useRef(0);
  const resetStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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
    setPdfLoading(true);
    try {
      const res = await fetch(`${APP_BASE_PATH}/api/pdf`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gad-badr-resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      window.alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, []);

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

  return (
    <EditModeContext.Provider
      value={{ isEditing: editEnabled, toggle: () => setIsEditing((value) => !value) }}
    >
      <div className="no-print sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Resume Editor
            </span>
            {savedAtLabel && (
              <p className="text-[11px] text-gray-400">Last saved {savedAtLabel}</p>
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

            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 rounded bg-gray-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              {pdfLoading ? 'Generating...' : 'Download PDF'}
            </button>

            {canEdit ? (
              <>
                <button
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
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  {logoutLoading ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : (
              <Link
                href={`${APP_BASE_PATH}/login`}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100"
              >
                Owner login
              </Link>
            )}
          </div>
        </div>

        {editEnabled && <div className="h-0.5 w-full bg-[#8B0000]" />}
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-sm bg-white shadow-xl">
          <div className="p-8 md:p-12">
            <Header
              data={data.personalInfo}
              onChange={(personalInfo) => setData((current) => ({ ...current, personalInfo }))}
            />

            <div className="mt-0 grid grid-cols-1 gap-8 md:grid-cols-[3fr_2fr]">
              <div className="space-y-8">
                <ExperienceSection
                  items={data.experience as ExperienceEntry[]}
                  onChange={(experience) => setData((current) => ({ ...current, experience }))}
                />
                <ProjectsSection
                  items={data.projects as ProjectEntry[]}
                  onChange={(projects) => setData((current) => ({ ...current, projects }))}
                />
              </div>

              <div className="space-y-7">
                <AboutMeSection
                  text={data.about}
                  onChange={(about) => setData((current) => ({ ...current, about }))}
                />
                <SkillsSection
                  skills={data.skills}
                  onChange={(skills) => setData((current) => ({ ...current, skills }))}
                />
                <EducationSection
                  items={data.education as EducationEntry[]}
                  onChange={(education) => setData((current) => ({ ...current, education }))}
                />
                <CertificatesSection
                  items={data.certificates as CertEntry[]}
                  onChange={(certificates) =>
                    setData((current) => ({ ...current, certificates }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <p className="no-print mt-4 text-center text-xs text-gray-400">
          {canEdit
            ? 'Authenticated edits are auto-saved to MongoDB, with local draft recovery on failure.'
            : 'Read-only mode. Sign in as the owner to edit this resume.'}
        </p>
      </div>
    </EditModeContext.Provider>
  );
}
