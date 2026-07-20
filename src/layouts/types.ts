import type { ResumeLayoutId, SectionKey } from '@/types/resume';

export type LayoutColumn = 'main' | 'left' | 'right';

export interface LayoutSectionPlacement {
  section: SectionKey;
  column: LayoutColumn;
}

export interface ResumeLayoutDefinition {
  id: ResumeLayoutId;
  name: string;
  description: string;
  /** CSS class applied to the document root (e.g. layout-classic). */
  className: string;
  density: 'comfortable' | 'compact';
  columns: 1 | 2;
  sections: LayoutSectionPlacement[];
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  education: 'Education',
  certificates: 'Certificates',
  about: 'About Me',
};
