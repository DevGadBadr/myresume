import type { ResumeData, ResumeTemplate } from '@/types/resume';
import { assembleTemplateResume } from '@/lib/template-content';

export const DEFAULT_TEMPLATE_ID = 'default';

export interface DerivedResumeTemplate {
  data: ResumeData;
  template: ResumeTemplate;
  hideContactInfo: boolean;
}

export function getActiveTemplate(data: ResumeData, templateId?: string) {
  const requestedId = templateId || data.activeTemplateId || DEFAULT_TEMPLATE_ID;
  return (
    data.templates.find((template) => template.id === requestedId) ??
    data.templates.find((template) => template.id === DEFAULT_TEMPLATE_ID) ??
    data.templates[0]
  );
}

export function deriveResumeForTemplate(
  data: ResumeData,
  templateId?: string
): DerivedResumeTemplate {
  const template = getActiveTemplate(data, templateId);

  if (!template) {
    return { data, template: data.templates[0], hideContactInfo: false };
  }

  return {
    data: assembleTemplateResume(data, template),
    template,
    hideContactInfo: template.hideContactInfo,
  };
}

export { assembleTemplateResume } from '@/lib/template-content';
