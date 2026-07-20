import type {
  CertEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  ResumeTemplate,
  ResumeTemplateContent,
  SkillEntry,
} from '@/types/resume';
import { cloneLayoutSettings } from '@/lib/layout-settings';

/** Legacy shape stored before template-owned content migration. */
export interface LegacyResumeTemplateSelection {
  experienceIds: string[];
  experienceBulletIndexes?: Record<string, number[]>;
  projectIds: string[];
  projectBulletIndexes?: Record<string, number[]>;
  skillIds: string[];
  educationIds: string[];
  certificateIds: string[];
}

export interface LegacyResumeTemplate extends Omit<ResumeTemplate, 'content'> {
  summaryOverride?: string;
  selected?: LegacyResumeTemplateSelection;
  content?: ResumeTemplateContent;
}

function cloneExperience(entry: ExperienceEntry): ExperienceEntry {
  return { ...entry, bullets: [...entry.bullets] };
}

function cloneProject(entry: ProjectEntry): ProjectEntry {
  const cloned: ProjectEntry = {
    ...entry,
    bullets: [...entry.bullets],
    tags: [...entry.tags],
  };
  if (entry.deployment) {
    cloned.deployment = {
      ...entry.deployment,
      credentials: entry.deployment.credentials?.map((credential) => ({ ...credential })),
    };
  }
  return cloned;
}

function cloneSkill(entry: SkillEntry): SkillEntry {
  return { ...entry };
}

function cloneEducation(entry: EducationEntry): EducationEntry {
  return { ...entry };
}

function cloneCertificate(entry: CertEntry): CertEntry {
  return { ...entry };
}

export function deepCloneContent(
  from: Pick<
    ResumeData,
    'about' | 'experience' | 'projects' | 'skills' | 'education' | 'certificates' | 'layout'
  >
): ResumeTemplateContent {
  return {
    about: from.about,
    experience: from.experience.map(cloneExperience),
    projects: from.projects.map(cloneProject),
    skills: from.skills.map(cloneSkill),
    education: from.education.map(cloneEducation),
    certificates: from.certificates.map(cloneCertificate),
    layout: cloneLayoutSettings(from.layout),
  };
}

function filterBullets<T extends ExperienceEntry | ProjectEntry>(
  item: T,
  indexes: number[] | undefined
): T {
  const cloned = { ...item, bullets: [...item.bullets] };
  if (!indexes || indexes.length === 0) {
    return cloned as T;
  }

  const selectedIndexes = new Set(indexes);
  cloned.bullets = cloned.bullets.filter((_, index) => selectedIndexes.has(index));
  return cloned as T;
}

function orderByIds<T extends { id: string }>(items: T[], selectedIds: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return selectedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item))
    .map((item) =>
      'bullets' in item && Array.isArray(item.bullets)
        ? ({ ...item, bullets: [...item.bullets] } as T)
        : ({ ...item } as T)
    );
}

type ResumeLibrary = Pick<
  ResumeData,
  'about' | 'experience' | 'projects' | 'skills' | 'education' | 'certificates'
>;

export function buildContentFromLegacySelection(
  data: ResumeLibrary,
  template: LegacyResumeTemplate
): ResumeTemplateContent {
  const selected = template.selected;
  if (!selected) {
    return deepCloneContent(data);
  }

  return {
    about: template.summaryOverride?.trim() || data.about,
    experience: orderByIds(data.experience, selected.experienceIds).map((item) =>
      filterBullets(item, selected.experienceBulletIndexes?.[item.id])
    ),
    projects: orderByIds(data.projects, selected.projectIds).map((item) =>
      filterBullets(item, selected.projectBulletIndexes?.[item.id])
    ),
    skills: orderByIds(data.skills, selected.skillIds).map(cloneSkill),
    education: orderByIds(data.education, selected.educationIds).map(cloneEducation),
    certificates: orderByIds(data.certificates, selected.certificateIds).map(cloneCertificate),
  };
}

export function ensureTemplateContent(data: ResumeLibrary, template: LegacyResumeTemplate): ResumeTemplate {
  if (template.content) {
    return {
      id: template.id,
      name: template.name,
      hideContactInfo: template.hideContactInfo,
      targetTitle: template.targetTitle,
      layoutId: template.layoutId,
      content: deepCloneContent(template.content),
    };
  }

  return {
    id: template.id,
    name: template.name,
    hideContactInfo: template.hideContactInfo,
    targetTitle: template.targetTitle,
    layoutId: template.layoutId,
    content: buildContentFromLegacySelection(data, template),
  };
}

export function migrateTemplates(data: ResumeData): ResumeData {
  return {
    ...data,
    templates: data.templates.map((template) => ensureTemplateContent(data, template as LegacyResumeTemplate)),
  };
}

export function assembleTemplateResume(root: ResumeData, template: ResumeTemplate): ResumeData {
  const content = template.content;
  return {
    ...root,
    personalInfo: {
      ...root.personalInfo,
      title: template.targetTitle || root.personalInfo.title,
    },
    about: content.about,
    experience: content.experience,
    projects: content.projects,
    skills: content.skills,
    education: content.education,
    certificates: content.certificates,
    layout: cloneLayoutSettings(content.layout),
    layoutId: template.layoutId ?? root.layoutId,
    activeTemplateId: template.id,
  };
}

export type TemplateContentSectionKey = keyof ResumeTemplateContent;

export function importSectionFromMain(
  content: ResumeTemplateContent,
  main: ResumeData,
  section: TemplateContentSectionKey
): ResumeTemplateContent {
  if (section === 'about') {
    return { ...content, about: main.about };
  }

  return {
    ...content,
    [section]: deepCloneContent(main)[section],
  };
}

export function mergeResumeWithLayout(
  data: ResumeData,
  layout?: ResumeData['layout']
): ResumeData {
  return {
    ...data,
    layout: cloneLayoutSettings(layout ?? data.layout),
  };
}
