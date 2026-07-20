import type { ResumeTemplate } from '@/types/resume';

function shortId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function buildVariantDisplayName(jobTitle: string, company?: string) {
  const title = jobTitle.trim();
  const firm = company?.trim();
  if (firm) {
    return `${firm} – ${title}`;
  }
  return title;
}

export function createVariantTemplateId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'ai-variant'}-${shortId()}`;
}

export function normalizeVariantNameKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Ensure display name is unique among existing templates (case-insensitive). */
export function ensureUniqueVariantName(desiredName: string, existingNames: string[]) {
  const used = new Set(existingNames.map(normalizeVariantNameKey));
  const base = desiredName.trim() || 'AI Tailored Resume';
  if (!used.has(normalizeVariantNameKey(base))) {
    return base;
  }

  let suffix = 2;
  while (used.has(normalizeVariantNameKey(`${base} (${suffix})`))) {
    suffix += 1;
  }
  return `${base} (${suffix})`;
}

export function withUniqueSavedName(
  draft: ResumeTemplate,
  existingTemplates: ResumeTemplate[]
): ResumeTemplate {
  const name = ensureUniqueVariantName(
    draft.name,
    existingTemplates.map((item) => item.name)
  );
  if (name === draft.name) {
    return draft;
  }
  return { ...draft, name };
}
