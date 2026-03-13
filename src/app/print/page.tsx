export const dynamic = 'force-dynamic';

import PrintContent from '@/components/PrintContent';
import { getResumeData } from '@/lib/resume-store';

export default async function PrintPage() {
  const resumeData = await getResumeData();
  return <PrintContent data={resumeData} />;
}
