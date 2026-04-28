import type {
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  ResumeTemplate,
} from '@/types/resume';

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

function filterBullets<T extends ExperienceEntry | ProjectEntry>(
  item: T,
  indexes: number[] | undefined
): T {
  if (!indexes || indexes.length === 0) {
    return item;
  }

  const selectedIndexes = new Set(indexes);
  return {
    ...item,
    bullets: item.bullets.filter((_, index) => selectedIndexes.has(index)),
  };
}

function orderByIds<T extends { id: string }>(items: T[], selectedIds: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return selectedIds.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

export function deriveResumeForTemplate(
  data: ResumeData,
  templateId?: string
): DerivedResumeTemplate {
  const template = getActiveTemplate(data, templateId);

  if (!template) {
    return { data, template: data.templates[0], hideContactInfo: false };
  }

  const selected = template.selected;
  const nextData: ResumeData = {
    ...data,
    personalInfo: {
      ...data.personalInfo,
      title: template.targetTitle || data.personalInfo.title,
    },
    about: template.summaryOverride || data.about,
    experience: orderByIds(data.experience, selected.experienceIds).map((item) =>
      filterBullets(item, selected.experienceBulletIndexes?.[item.id])
    ),
    projects: orderByIds(data.projects, selected.projectIds).map((item) =>
      filterBullets(item, selected.projectBulletIndexes?.[item.id])
    ),
    skills: orderByIds(data.skills, selected.skillIds),
    education: orderByIds(data.education, selected.educationIds),
    certificates: orderByIds(data.certificates, selected.certificateIds),
    activeTemplateId: template.id,
  };

  return {
    data: nextData,
    template,
    hideContactInfo: template.hideContactInfo,
  };
}
