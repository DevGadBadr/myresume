export interface ContactLink {
  label: string;
  url: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phones: string[];
  location: string;
  links: ContactLink[];
}

export interface ExperienceEntry {
  id: string;
  role: string;
  roleSubtitle: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface ProjectCredentialField {
  id: string;
  label: string;
  value: string;
}

export interface ProjectDeployment {
  url?: string;
  credentials?: ProjectCredentialField[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  tags: string[];
  deployment?: ProjectDeployment;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  period: string;
}

export interface CertEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  hours?: string;
  link?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  about: string;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string[];
  education: EducationEntry[];
  certificates: CertEntry[];
}
