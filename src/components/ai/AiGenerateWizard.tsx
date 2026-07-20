'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { id: 'read', label: 'Reading the job description', detail: 'Extracting role, skills, and priorities' },
  { id: 'match', label: 'Matching your library', detail: 'Selecting relevant experience and projects' },
  { id: 'tailor', label: 'Tailoring bullets & about', detail: 'Rewriting for this JD without inventing facts' },
  { id: 'assemble', label: 'Assembling the draft', detail: 'Keeping your layout, order, and spacers' },
] as const;

const STEP_INTERVAL_MS = 2200;

interface AiGenerateWizardProps {
  jobTitle?: string;
  company?: string;
}

export default function AiGenerateWizard({ jobTitle, company }: AiGenerateWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    const id = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const target =
    [jobTitle?.trim(), company?.trim()].filter(Boolean).join(' · ') || 'this role';
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <div className="relative flex min-h-[480px] items-center justify-center overflow-hidden rounded border border-[var(--resume-border)] bg-[var(--resume-panel)] p-6 sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--resume-text) 8%, transparent), transparent 42%), radial-gradient(circle at 82% 78%, color-mix(in srgb, var(--resume-text) 6%, transparent), transparent 40%)',
        }}
      />

      <div className="relative z-10 grid w-full max-w-3xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)] lg:items-center">
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--resume-muted)]">
              Generating draft
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--resume-text)] sm:text-2xl">
              Tailoring for {target}
            </h3>
            <p className="mt-2 max-w-md text-sm text-[var(--resume-muted)]">
              Building a preview from your library. Nothing is saved until you choose to keep the
              variant.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--resume-border)]">
              <div
                className="h-full rounded-full bg-[var(--resume-accent)] transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] tabular-nums text-[var(--resume-subtle)]">
              Step {activeStep + 1} of {STEPS.length}
            </p>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, index) => {
              const done = index < activeStep;
              const active = index === activeStep;
              return (
                <li
                  key={step.id}
                  className={`flex gap-3 rounded-lg border px-3 py-2.5 transition-all duration-500 ${
                    active
                      ? 'border-[var(--resume-accent-border)] bg-[var(--resume-paper)] shadow-sm'
                      : done
                        ? 'border-transparent bg-transparent opacity-70'
                        : 'border-transparent opacity-40'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                      done
                        ? 'bg-[var(--resume-accent)] text-[var(--resume-paper)]'
                        : active
                          ? 'border border-[var(--resume-accent)] text-[var(--resume-accent)]'
                          : 'border border-[var(--resume-border)] text-[var(--resume-muted)]'
                    }`}
                  >
                    {done ? (
                      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                        <path
                          d="M2.5 6.2 4.8 8.5 9.5 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        active ? 'text-[var(--resume-text)]' : 'text-[var(--resume-muted)]'
                      }`}
                    >
                      {step.label}
                      {active && (
                        <span className="ml-1.5 inline-flex gap-0.5 align-middle" aria-hidden>
                          <span className="ai-wizard-dot h-1 w-1 rounded-full bg-[var(--resume-accent)]" />
                          <span className="ai-wizard-dot ai-wizard-dot-delay-1 h-1 w-1 rounded-full bg-[var(--resume-accent)]" />
                          <span className="ai-wizard-dot ai-wizard-dot-delay-2 h-1 w-1 rounded-full bg-[var(--resume-accent)]" />
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--resume-subtle)]">{step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div
          aria-hidden
          className="relative mx-auto hidden h-[280px] w-[200px] sm:block lg:mx-0 lg:justify-self-end"
        >
          <div className="absolute inset-0 origin-bottom -rotate-3 rounded border border-[var(--resume-border)] bg-[var(--resume-paper)] shadow-sm" />
          <div className="absolute inset-0 origin-bottom rotate-2 rounded border border-[var(--resume-border)] bg-[var(--resume-paper)] shadow-md">
            <div className="space-y-3 p-4">
              <div className="h-2.5 w-2/3 animate-pulse rounded bg-[var(--resume-border)]" />
              <div className="h-1.5 w-1/2 animate-pulse rounded bg-[var(--resume-border)]" />
              <div className="mt-4 space-y-2">
                <div className="h-1.5 w-full animate-pulse rounded bg-[var(--resume-border)]" />
                <div className="h-1.5 w-[92%] animate-pulse rounded bg-[var(--resume-border)]" />
                <div className="h-1.5 w-[78%] animate-pulse rounded bg-[var(--resume-border)]" />
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-1.5 w-1/3 animate-pulse rounded bg-[var(--resume-border)]" />
                <div className="h-1.5 w-full animate-pulse rounded bg-[var(--resume-border)]" />
                <div className="h-1.5 w-[88%] animate-pulse rounded bg-[var(--resume-border)]" />
                <div className="h-1.5 w-[70%] animate-pulse rounded bg-[var(--resume-border)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
