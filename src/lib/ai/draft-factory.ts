import type { ResumeData, ResumeTemplate } from '@/types/resume';
import { deepCloneContent } from '@/lib/template-content';
import { normalizeLayoutId } from '@/layouts';
import {
  buildVariantDisplayName,
  createVariantTemplateId,
} from '@/lib/ai/variant-naming';

export function createDraftTemplateFromLibrary(
  library: ResumeData,
  jobTitle: string,
  company?: string
): ResumeTemplate {
  const name = buildVariantDisplayName(jobTitle, company);
  return {
    id: createVariantTemplateId(name),
    name,
    hideContactInfo: false,
    targetTitle: jobTitle.trim() || undefined,
    layoutId: normalizeLayoutId(library.layoutId),
    sectionOrder: library.sectionOrder ? [...library.sectionOrder] : undefined,
    sectionSpacers: library.sectionSpacers?.map((item) => ({ ...item })),
    content: deepCloneContent(library),
  };
}
