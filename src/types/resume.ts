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

export type ResumeLayoutId = 'classic' | 'split' | 'compact';

export const RESUME_LAYOUT_IDS: ResumeLayoutId[] = ['classic', 'split', 'compact'];

export const DEFAULT_RESUME_LAYOUT_ID: ResumeLayoutId = 'classic';

export interface ExperienceEntry {
  id: string;
  role: string;
  roleSubtitle: string;
  company: string;
  period: string;
  bullets: string[];
  /** Force this entry onto the next printed page. */
  pageBreakBefore?: boolean;
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
  pageBreakBefore?: boolean;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  period: string;
  pageBreakBefore?: boolean;
}

export interface CertEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  hours?: string;
  link?: string;
  pageBreakBefore?: boolean;
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

export const ALL_SECTION_KEYS: SectionKey[] = [
  'about',
  'experience',
  'projects',
  'education',
  'certificates',
  'skills',
];

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === 'string' && (ALL_SECTION_KEYS as string[]).includes(value);
}

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
  /** Visual layout theme for this resume variant. */
  layoutId?: ResumeLayoutId;
  /** Custom main-section order for this resume variant. */
  sectionOrder?: SectionKey[];
  /** Blank space (in lines) after specific sections. */
  sectionSpacers?: SectionSpacer[];
  content: ResumeTemplateContent;
}

export interface SectionSpacer {
  afterSection: SectionKey;
  /** Number of blank lines of vertical space after the section. */
  lines: number;
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
  /** Default visual layout when editing the library body. */
  layoutId?: ResumeLayoutId;
  /** Custom main-section order for the library body. */
  sectionOrder?: SectionKey[];
  /** Blank space (in lines) after specific sections. */
  sectionSpacers?: SectionSpacer[];
  layout?: ResumeLayoutSettings;
}
