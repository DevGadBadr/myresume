export const dynamic = 'force-dynamic';

import PrintContent from '@/components/PrintContent';
import { getResumeData } from '@/lib/resume-store';
import { deriveResumeForTemplate } from '@/lib/resume-template';

interface PrintPageProps {
  searchParams?: Promise<{ template?: string }>;
}

export default async function PrintPage({ searchParams }: PrintPageProps) {
  const resumeData = await getResumeData();
  const params = searchParams ? await searchParams : {};
  const derived = deriveResumeForTemplate(resumeData, params.template);

  return <PrintContent data={derived.data} hideContactInfo={derived.hideContactInfo} />;
}
