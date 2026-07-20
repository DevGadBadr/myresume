import type { ResumeTemplate, SectionKey } from '@/types/resume';

export type AiContentAddedKind =
  | 'soft_skill'
  | 'keyword'
  | 'phrasing'
  | 'about'
  | 'bullet'
  | 'other';

export interface AiContentAddedItem {
  kind: AiContentAddedKind;
  where: string;
  text: string;
  reason: string;
}

export type AiLibraryProposalKind = 'skill' | 'bullet' | 'about' | 'project' | 'other';

export interface AiLibraryProposal {
  kind: AiLibraryProposalKind;
  suggestedText: string;
  targetHint: string;
  reason: string;
}

export interface AiTailorSummary {
  overview: string;
  contentAdded: AiContentAddedItem[];
  libraryProposals: AiLibraryProposal[];
  gaps: string[];
  keywordFocus: string[];
}

export interface AiGenerateRequest {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  notes?: string;
}

export interface AiGenerateResponse {
  draftTemplate: ResumeTemplate;
  summary: AiTailorSummary;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  draftTemplate: ResumeTemplate;
  messages: AiChatMessage[];
  summary?: AiTailorSummary;
}

export interface AiChatResponse {
  draftTemplate: ResumeTemplate;
  assistantMessage: string;
  summary?: AiTailorSummary;
}

/** Structured JSON the generate model must return. */
export interface AiGenerateModelOutput {
  targetTitle?: string;
  about: string;
  sectionOrder?: SectionKey[];
  experience: Array<{
    id: string;
    role?: string;
    roleSubtitle?: string;
    company?: string;
    period?: string;
    bullets: string[];
  }>;
  projects: Array<{
    id: string;
    title?: string;
    description?: string;
    bullets: string[];
    tags?: string[];
  }>;
  skills: Array<{
    id?: string;
    label: string;
    category?: string;
  }>;
  education?: Array<{
    id: string;
    degree?: string;
    institution?: string;
    period?: string;
  }>;
  certificates?: Array<{
    id: string;
    title?: string;
    issuer?: string;
    date?: string;
    hours?: string;
    link?: string;
  }>;
  summary: AiTailorSummary;
}

export interface CompactExperience {
  id: string;
  role: string;
  roleSubtitle: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface CompactProject {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  tags: string[];
}

export interface CompactSkill {
  id: string;
  label: string;
  category?: string;
}

export interface CompactEducation {
  id: string;
  degree: string;
  institution: string;
  period: string;
}

export interface CompactCertificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  hours?: string;
}

export interface CompactLibrary {
  title: string;
  about: string;
  experience: CompactExperience[];
  projects: CompactProject[];
  skills: CompactSkill[];
  education: CompactEducation[];
  certificates: CompactCertificate[];
  sectionOrder?: SectionKey[];
}

export interface CompactDraft {
  name: string;
  targetTitle?: string;
  about: string;
  experience: CompactExperience[];
  projects: CompactProject[];
  skills: CompactSkill[];
  education: CompactEducation[];
  certificates: CompactCertificate[];
  sectionOrder?: SectionKey[];
}
