'use client';

import { useEditMode } from '@/context/EditModeContext';
import type { SectionKey } from '@/types/resume';

interface SectionMinHeightControlProps {
  section: SectionKey;
  minHeightMm?: number;
  onChange: (minHeightMm: number | undefined) => void;
}

export default function SectionMinHeightControl({
  section,
  minHeightMm = 0,
  onChange,
}: SectionMinHeightControlProps) {
  const { isEditing } = useEditMode();
  if (!isEditing) {
    return null;
  }

  return (
    <div className="resume-section-min-height no-print mt-1 flex items-center gap-2 text-[10px] text-gray-500">
      <label htmlFor={`min-height-${section}`}>Min height (mm)</label>
      <input
        id={`min-height-${section}`}
        type="number"
        min={0}
        step={1}
        value={minHeightMm || ''}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value === '' ? undefined : Math.max(0, Number(value)));
        }}
        className="w-14 rounded border border-gray-200 px-1 py-0.5 text-[10px]"
      />
    </div>
  );
}
