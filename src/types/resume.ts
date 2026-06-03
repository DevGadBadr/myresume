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

export interface SkillEntry {
  id: string;
  label: string;
  category?: string;
}

export type SectionKey =
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certificates'
  | 'about';

export type LayoutAnchor =
  | { kind: 'afterHeader' }
  | { kind: 'beforeSection'; section: SectionKey }
  | { kind: 'afterSection'; section: SectionKey }
  | { kind: 'beforeEntry'; section: SectionKey; entryId: string }
  | { kind: 'afterEntry'; section: SectionKey; entryId: string };

export interface LayoutControl {
  id: string;
  type: 'spacer' | 'pageBreak';
  anchor: LayoutAnchor;
  heightMm?: number;
}

export interface SectionLayoutStyle {
  minHeightMm?: number;
  paddingBottomMm?: number;
}

export interface PageMarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ResumeLayoutSettings {
  controls: LayoutControl[];
  sections?: Partial<Record<SectionKey, SectionLayoutStyle>>;
  pageMargins?: Partial<PageMarginsMm>;
}

export const DEFAULT_LAYOUT_SETTINGS: ResumeLayoutSettings = {
  controls: [],
  sections: {},
};

export interface ResumeTemplateContent {
  about: string;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillEntry[];
  education: EducationEntry[];
  certificates: CertEntry[];
  layout?: ResumeLayoutSettings;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  targetTitle?: string;
  hideContactInfo: boolean;
  content: ResumeTemplateContent;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  about: string;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillEntry[];
  education: EducationEntry[];
  certificates: CertEntry[];
  templates: ResumeTemplate[];
  activeTemplateId?: string;
  layout?: ResumeLayoutSettings;
}
