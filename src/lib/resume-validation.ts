import { DEFAULT_RESUME_DATA } from '@/lib/defaultData';
import type {
  CertEntry,
  ContactLink,
  EducationEntry,
  ExperienceEntry,
  PersonalInfo,
  ProjectCredentialField,
  ProjectDeployment,
  ProjectEntry,
  ResumeData,
  ResumeTemplate,
  ResumeTemplateSelection,
  SkillEntry,
} from '@/types/resume';

export class ResumeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeValidationError';
  }
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readObject(value: unknown, path: string) {
  if (!isRecord(value)) {
    throw new ResumeValidationError(`${path} must be an object`);
  }

  return value;
}

function readString(value: unknown, path: string) {
  if (typeof value !== 'string') {
    throw new ResumeValidationError(`${path} must be a string`);
  }

  return value.trim();
}

function readStringArray(value: unknown, path: string) {
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be an array`);
  }

  return value.map((item, index) => readString(item, `${path}[${index}]`));
}

function slugifyId(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function dedupeId(baseId: string, usedIds: Set<string>) {
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function readContactLink(value: unknown, path: string): ContactLink {
  const record = readObject(value, path);
  return {
    label: readString(record.label, `${path}.label`),
    url: readString(record.url, `${path}.url`),
  };
}

function readPersonalInfo(value: unknown): PersonalInfo {
  const record = readObject(value, 'personalInfo');
  return {
    name: readString(record.name, 'personalInfo.name'),
    title: readString(record.title, 'personalInfo.title'),
    email: readString(record.email, 'personalInfo.email'),
    phones: readStringArray(record.phones, 'personalInfo.phones'),
    location: readString(record.location, 'personalInfo.location'),
    links: Array.isArray(record.links)
      ? record.links.map((item, index) => readContactLink(item, `personalInfo.links[${index}]`))
      : (() => {
          throw new ResumeValidationError('personalInfo.links must be an array');
        })(),
  };
}

function readExperienceEntry(value: unknown, path: string): ExperienceEntry {
  const record = readObject(value, path);
  return {
    id: readString(record.id, `${path}.id`),
    role: readString(record.role, `${path}.role`),
    roleSubtitle: readString(record.roleSubtitle, `${path}.roleSubtitle`),
    company: readString(record.company, `${path}.company`),
    period: readString(record.period, `${path}.period`),
    bullets: readStringArray(record.bullets, `${path}.bullets`),
  };
}

function readProjectCredentialField(value: unknown, path: string): ProjectCredentialField {
  const record = readObject(value, path);
  return {
    id: readString(record.id, `${path}.id`),
    label: readString(record.label, `${path}.label`),
    value: readString(record.value, `${path}.value`),
  };
}

function readProjectDeployment(value: unknown, path: string): ProjectDeployment {
  const record = readObject(value, path);
  const deployment: ProjectDeployment = {};

  if (typeof record.url === 'string' && record.url.trim()) {
    deployment.url = record.url.trim();
  }

  if (record.credentials !== undefined) {
    if (!Array.isArray(record.credentials)) {
      throw new ResumeValidationError(`${path}.credentials must be an array`);
    }

    const credentials = record.credentials.map((item, index) =>
      readProjectCredentialField(item, `${path}.credentials[${index}]`)
    );

    if (credentials.length > 0) {
      deployment.credentials = credentials;
    }
  }

  return deployment;
}

function readProjectEntry(value: unknown, path: string): ProjectEntry {
  const record = readObject(value, path);
  const entry: ProjectEntry = {
    id: readString(record.id, `${path}.id`),
    title: readString(record.title, `${path}.title`),
    description: readString(record.description, `${path}.description`),
    bullets: readStringArray(record.bullets, `${path}.bullets`),
    tags: readStringArray(record.tags, `${path}.tags`),
  };
  if (record.deployment !== undefined) {
    entry.deployment = readProjectDeployment(record.deployment, `${path}.deployment`);
  }
  return entry;
}

function readEducationEntry(value: unknown, path: string): EducationEntry {
  const record = readObject(value, path);
  return {
    id: readString(record.id, `${path}.id`),
    degree: readString(record.degree, `${path}.degree`),
    institution: readString(record.institution, `${path}.institution`),
    period: readString(record.period, `${path}.period`),
  };
}

function readCertificateEntry(value: unknown, path: string): CertEntry {
  const record = readObject(value, path);
  const entry: CertEntry = {
    id: readString(record.id, `${path}.id`),
    title: readString(record.title, `${path}.title`),
    issuer: readString(record.issuer, `${path}.issuer`),
    date: readString(record.date, `${path}.date`),
  };
  if (typeof record.hours === 'string' && record.hours.trim()) entry.hours = record.hours.trim();
  if (typeof record.link === 'string' && record.link.trim()) entry.link = record.link.trim();
  return entry;
}

function readSkills(value: unknown): SkillEntry[] {
  if (!Array.isArray(value)) {
    throw new ResumeValidationError('skills must be an array');
  }

  const usedIds = new Set<string>();
  return value.map((item, index) => {
    if (typeof item === 'string') {
      const label = readString(item, `skills[${index}]`);
      return {
        id: dedupeId(`skill-${slugifyId(label, String(index + 1))}`, usedIds),
        label,
      };
    }

    const record = readObject(item, `skills[${index}]`);
    const label = readString(record.label, `skills[${index}].label`);
    const id =
      typeof record.id === 'string' && record.id.trim()
        ? readString(record.id, `skills[${index}].id`)
        : `skill-${slugifyId(label, String(index + 1))}`;

    const skill: SkillEntry = {
      id: dedupeId(id, usedIds),
      label,
    };

    if (typeof record.category === 'string' && record.category.trim()) {
      skill.category = record.category.trim();
    }

    return skill;
  });
}

function readNumberArray(value: unknown, path: string) {
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be an array`);
  }

  return value.map((item, index) => {
    if (typeof item !== 'number' || !Number.isInteger(item) || item < 0) {
      throw new ResumeValidationError(`${path}[${index}] must be a non-negative integer`);
    }
    return item;
  });
}

function readBulletIndexMap(value: unknown, path: string) {
  if (value === undefined) {
    return undefined;
  }

  const record = readObject(value, path);
  const result: Record<string, number[]> = {};

  Object.entries(record).forEach(([id, indexes]) => {
    result[id] = readNumberArray(indexes, `${path}.${id}`);
  });

  return result;
}

function readTemplateSelection(value: unknown, path: string): ResumeTemplateSelection {
  const record = readObject(value, path);

  return {
    experienceIds: readStringArray(record.experienceIds ?? [], `${path}.experienceIds`),
    experienceBulletIndexes: readBulletIndexMap(
      record.experienceBulletIndexes,
      `${path}.experienceBulletIndexes`
    ),
    projectIds: readStringArray(record.projectIds ?? [], `${path}.projectIds`),
    projectBulletIndexes: readBulletIndexMap(
      record.projectBulletIndexes,
      `${path}.projectBulletIndexes`
    ),
    skillIds: readStringArray(record.skillIds ?? [], `${path}.skillIds`),
    educationIds: readStringArray(record.educationIds ?? [], `${path}.educationIds`),
    certificateIds: readStringArray(record.certificateIds ?? [], `${path}.certificateIds`),
  };
}

function readResumeTemplate(value: unknown, path: string): ResumeTemplate {
  const record = readObject(value, path);
  const template: ResumeTemplate = {
    id: readString(record.id, `${path}.id`),
    name: readString(record.name, `${path}.name`),
    hideContactInfo:
      typeof record.hideContactInfo === 'boolean' ? record.hideContactInfo : false,
    selected: readTemplateSelection(record.selected ?? {}, `${path}.selected`),
  };

  if (typeof record.targetTitle === 'string' && record.targetTitle.trim()) {
    template.targetTitle = record.targetTitle.trim();
  }

  if (typeof record.summaryOverride === 'string' && record.summaryOverride.trim()) {
    template.summaryOverride = record.summaryOverride.trim();
  }

  return template;
}

function createDefaultTemplates(data: Omit<ResumeData, 'templates' | 'activeTemplateId'>) {
  const allSelection: ResumeTemplateSelection = {
    experienceIds: data.experience.map((item) => item.id),
    projectIds: data.projects.map((item) => item.id),
    skillIds: data.skills.map((item) => item.id),
    educationIds: data.education.map((item) => item.id),
    certificateIds: data.certificates.map((item) => item.id),
  };

  const upworkSkillLabels = new Set([
    'Python',
    'TypeScript',
    'JavaScript',
    'React',
    'Node.js',
    'NestJS',
    'Selenium',
    'Playwright',
    'MongoDB',
    'Docker',
    'APIs',
    'Web Development',
  ]);

  return [
    {
      id: 'default',
      name: 'Default Resume',
      hideContactInfo: false,
      selected: allSelection,
    },
    {
      id: 'upwork',
      name: 'Upwork Resume',
      hideContactInfo: true,
      selected: {
        ...allSelection,
        skillIds: data.skills
          .filter((skill) => upworkSkillLabels.has(skill.label))
          .map((skill) => skill.id),
      },
    },
  ];
}

export function normalizeResumeData(value: unknown): ResumeData {
  const record = readObject(value, 'resume');
  const data = {
    personalInfo: readPersonalInfo(record.personalInfo),
    about: readString(record.about, 'about'),
    experience: Array.isArray(record.experience)
      ? record.experience.map((item, index) => readExperienceEntry(item, `experience[${index}]`))
      : (() => {
          throw new ResumeValidationError('experience must be an array');
        })(),
    projects: Array.isArray(record.projects)
      ? record.projects.map((item, index) => readProjectEntry(item, `projects[${index}]`))
      : (() => {
          throw new ResumeValidationError('projects must be an array');
        })(),
    skills: readSkills(record.skills),
    education: Array.isArray(record.education)
      ? record.education.map((item, index) => readEducationEntry(item, `education[${index}]`))
      : (() => {
          throw new ResumeValidationError('education must be an array');
        })(),
    certificates: Array.isArray(record.certificates)
      ? record.certificates.map((item, index) =>
          readCertificateEntry(item, `certificates[${index}]`)
        )
      : (() => {
          throw new ResumeValidationError('certificates must be an array');
        })(),
  };

  const templates = Array.isArray(record.templates)
    ? record.templates.map((item, index) => readResumeTemplate(item, `templates[${index}]`))
    : createDefaultTemplates(data);

  const activeTemplateId =
    typeof record.activeTemplateId === 'string' && record.activeTemplateId.trim()
      ? record.activeTemplateId.trim()
      : templates[0]?.id;

  return {
    ...data,
    templates: templates.length > 0 ? templates : createDefaultTemplates(data),
    activeTemplateId,
  };
}

export function normalizeStoredResume(value: unknown): ResumeData {
  try {
    return normalizeResumeData(value);
  } catch {
    return DEFAULT_RESUME_DATA;
  }
}

export function tryNormalizeResumeData(value: unknown) {
  try {
    return { ok: true as const, data: normalizeResumeData(value) };
  } catch (error) {
    const message =
      error instanceof ResumeValidationError ? error.message : 'Invalid resume payload';
    return { ok: false as const, error: message };
  }
}
