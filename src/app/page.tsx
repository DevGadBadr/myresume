import EditorShell from '@/components/EditorShell';
import { isAuthenticated } from '@/lib/auth';
import { getResumeData } from '@/lib/resume-store';

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  const [initialData, canEdit] = await Promise.all([getResumeData(), isAuthenticated()]);

  return <EditorShell initialData={initialData} canEdit={canEdit} />;
}
