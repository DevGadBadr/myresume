import type { ResumeData, ResumeTemplate } from '@/types/resume';
import { ResumeValidationError, normalizeResumeData } from '@/lib/resume-validation';

export function normalizeIncomingDraftTemplate(
  library: ResumeData,
  draft: unknown
): ResumeTemplate {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
    throw new ResumeValidationError('draftTemplate must be an object');
  }

  const record = draft as Record<string, unknown>;
  const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : 'ai-draft';

  const normalized = normalizeResumeData({
    ...library,
    templates: [draft],
    activeTemplateId: id,
  });

  const template = normalized.templates.find((item) => item.id === id) ?? normalized.templates[0];
  if (!template) {
    throw new ResumeValidationError('Failed to normalize draftTemplate');
  }
  return template;
}

export function readRequiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ResumeValidationError(`${field} is required`);
  }
  return value.trim();
}

export function readOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}
