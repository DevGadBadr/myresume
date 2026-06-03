'use client';

import { useMemo } from 'react';
import { buildBlockStream } from '@/lib/resume-blocks';
import { normalizeLayoutSettings } from '@/lib/layout-settings';
import type { ResumeData } from '@/types/resume';
import ResumeBlockRenderer from '@/components/ResumeBlockRenderer';

interface ResumeBlockDocumentProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
  visibleBlockIds?: Set<string>;
  onLayoutChange?: (
    updater: (layout: import('@/types/resume').ResumeLayoutSettings) => import('@/types/resume').ResumeLayoutSettings
  ) => void;
  onSpacerResize?: (controlId: string, heightMm: number) => void;
}

export default function ResumeBlockDocument({
  data,
  onChange,
  hideContactInfo = false,
  visibleBlockIds,
  onLayoutChange,
  onSpacerResize,
}: ResumeBlockDocumentProps) {
  const layout = normalizeLayoutSettings(data.layout);
  const blocks = useMemo(() => buildBlockStream(data, layout), [data, layout]);

  const handleLayoutChange = (
    updater: (layout: import('@/types/resume').ResumeLayoutSettings) => import('@/types/resume').ResumeLayoutSettings
  ) => {
    if (!onChange) return;
    onChange((current) => ({
      ...current,
      layout: updater(normalizeLayoutSettings(current.layout)),
    }));
  };

  return (
    <>
      {blocks.map((block) => {
        if (visibleBlockIds && !visibleBlockIds.has(block.id)) {
          return null;
        }
        const sectionStyle = block.section ? layout.sections?.[block.section] : undefined;
        return (
          <ResumeBlockRenderer
            key={block.id}
            block={block}
            data={data}
            onChange={onChange}
            hideContactInfo={hideContactInfo}
            sectionMinHeightMm={sectionStyle?.minHeightMm}
            onLayoutChange={onLayoutChange ? handleLayoutChange : undefined}
            onSpacerResize={onSpacerResize}
          />
        );
      })}
    </>
  );
}
