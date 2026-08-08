import type { ResumeData } from '@/types/resume';
import { deriveResumeForTemplate } from '@/lib/resume-template';
import type { PrintSource } from '@/lib/pdf/print-snapshot-store';

export interface ResolvedPrintResume {
  data: ResumeData;
  hideContactInfo: boolean;
}

/**
 * Resolve the document Puppeteer should render for PDF/print.
 * Library = full resume body; template = assembled variant.
 */
export function resolvePrintResume(
  resumeData: ResumeData,
  source: PrintSource,
  templateId?: string
): ResolvedPrintResume {
  if (source === 'library') {
    return { data: resumeData, hideContactInfo: false };
  }

  const derived = deriveResumeForTemplate(resumeData, templateId);
  return {
    data: derived.data,
    hideContactInfo: derived.hideContactInfo,
  };
}
