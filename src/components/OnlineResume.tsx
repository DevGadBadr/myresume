'use client';

import type { ResumeData } from '@/types/resume';
import ResumeDocument from '@/components/ResumeDocument';

interface OnlineResumeProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
}

export default function OnlineResume({ data, onChange }: OnlineResumeProps) {
  return (
    <div className="rounded border border-gray-200 bg-white px-7 py-8 shadow-sm">
      <ResumeDocument data={data} onChange={onChange} />
    </div>
  );
}
