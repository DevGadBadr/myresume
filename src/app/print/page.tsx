export const dynamic = 'force-dynamic';

import PrintContent from '@/components/PrintContent';
import { getPrintSnapshot, normalizePrintSource } from '@/lib/pdf/print-snapshot-store';
import { resolvePrintResume } from '@/lib/pdf/resolve-print-resume';
import { getResumeData } from '@/lib/resume-store';
import { normalizeColorTheme } from '@/lib/theme';

interface PrintPageProps {
  searchParams?: Promise<{
    template?: string;
    theme?: string;
    source?: string;
    token?: string;
  }>;
}

export default async function PrintPage({ searchParams }: PrintPageProps) {
  const params = searchParams ? await searchParams : {};
  const theme = normalizeColorTheme(params.theme);
  const source = normalizePrintSource(params.source);

  const snapshot = params.token ? getPrintSnapshot(params.token) : null;
  const resumeData = snapshot?.data ?? (await getResumeData());
  const printSource = snapshot?.source ?? source;
  const templateId = snapshot?.templateId ?? params.template;

  const resolved = resolvePrintResume(resumeData, printSource, templateId);

  return (
    <PrintContent data={resolved.data} hideContactInfo={resolved.hideContactInfo} theme={theme} />
  );
}
