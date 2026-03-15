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
  return {
    id: readString(record.id, `${path}.id`),
    title: readString(record.title, `${path}.title`),
    issuer: readString(record.issuer, `${path}.issuer`),
    date: readString(record.date, `${path}.date`),
  };
}

export function normalizeResumeData(value: unknown): ResumeData {
  const record = readObject(value, 'resume');

  return {
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
    skills: readStringArray(record.skills, 'skills'),
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
