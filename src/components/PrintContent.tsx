'use client';

import type { ResumeData } from '@/types/resume';
import { EditModeContext } from '@/context/EditModeContext';
import PaginatedResume from '@/components/PaginatedResume';

const noop = () => {};

interface PrintContentProps {
  data: ResumeData;
  hideContactInfo?: boolean;
}

export default function PrintContent({ data, hideContactInfo = false }: PrintContentProps) {
  return (
    <EditModeContext.Provider value={{ isEditing: false, toggle: noop }}>
      <PaginatedResume data={data} hideContactInfo={hideContactInfo} printMode />
    </EditModeContext.Provider>
  );
}
