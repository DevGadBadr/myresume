import type { ResumeLayoutDefinition } from '@/layouts/types';
import {
  DEFAULT_RESUME_LAYOUT_ID,
  RESUME_LAYOUT_IDS,
  type ResumeData,
  type ResumeLayoutId,
  type ResumeTemplate,
} from '@/types/resume';

export const CLASSIC_LAYOUT: ResumeLayoutDefinition = {
  id: 'classic',
  name: 'Classic',
  description: 'Single-column engineer CV with clear section rules',
  className: 'layout-classic',
  density: 'comfortable',
  columns: 1,
  sections: [
    { section: 'about', column: 'main' },
    { section: 'experience', column: 'main' },
    { section: 'projects', column: 'main' },
    { section: 'education', column: 'main' },
    { section: 'certificates', column: 'main' },
    { section: 'skills', column: 'main' },
  ],
};

export const SPLIT_LAYOUT: ResumeLayoutDefinition = {
  id: 'split',
  name: 'Split',
  description: 'Two columns with a vertical rule',
  className: 'layout-split',
  density: 'comfortable',
  columns: 2,
  sections: [
    { section: 'experience', column: 'left' },
    { section: 'projects', column: 'left' },
    { section: 'education', column: 'right' },
    { section: 'skills', column: 'right' },
    { section: 'certificates', column: 'right' },
    { section: 'about', column: 'right' },
  ],
};

export const COMPACT_LAYOUT: ResumeLayoutDefinition = {
  id: 'compact',
  name: 'Compact',
  description: 'Dense single column for longer histories',
  className: 'layout-compact',
  density: 'compact',
  columns: 1,
  sections: [
    { section: 'about', column: 'main' },
    { section: 'experience', column: 'main' },
    { section: 'projects', column: 'main' },
    { section: 'education', column: 'main' },
    { section: 'certificates', column: 'main' },
    { section: 'skills', column: 'main' },
  ],
};

export const RESUME_LAYOUTS: Record<ResumeLayoutId, ResumeLayoutDefinition> = {
  classic: CLASSIC_LAYOUT,
  split: SPLIT_LAYOUT,
  compact: COMPACT_LAYOUT,
};

export function isResumeLayoutId(value: unknown): value is ResumeLayoutId {
  return typeof value === 'string' && (RESUME_LAYOUT_IDS as string[]).includes(value);
}

export function normalizeLayoutId(value: unknown): ResumeLayoutId {
  return isResumeLayoutId(value) ? value : DEFAULT_RESUME_LAYOUT_ID;
}

export function getLayoutDefinition(layoutId?: ResumeLayoutId | null): ResumeLayoutDefinition {
  return RESUME_LAYOUTS[normalizeLayoutId(layoutId)];
}

/** Resolve which visual layout to use for a resume document view. */
export function resolveDocumentLayoutId(
  data: ResumeData,
  options?: { template?: ResumeTemplate | null }
): ResumeLayoutId {
  if (options?.template?.layoutId) {
    return normalizeLayoutId(options.template.layoutId);
  }
  return normalizeLayoutId(data.layoutId);
}
