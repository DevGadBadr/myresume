'use client';

import type { ResumeData } from '@/types/resume';
import ResumeDocument from '@/components/ResumeDocument';

interface OnlineResumeProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
}

export default function OnlineResume({ data, onChange }: OnlineResumeProps) {
  return (
    <div className="rounded border border-[var(--resume-border)] bg-[var(--resume-paper)] px-7 py-8 text-[var(--resume-text)] shadow-sm">
      <ResumeDocument data={data} onChange={onChange} />
    </div>
  );
}
