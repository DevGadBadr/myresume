'use client';

import type { ResumeBlock } from '@/lib/resume-blocks';
import type { ResumeData } from '@/types/resume';
import ResumeBlockRenderer from '@/components/ResumeBlockRenderer';
import { normalizeLayoutSettings } from '@/lib/layout-settings';

interface ContinuationPageLayoutProps {
  data: ResumeData;
  blockIds: string[];
  blocksById: Map<string, ResumeBlock>;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
  onLayoutChange?: (
    updater: (layout: import('@/types/resume').ResumeLayoutSettings) => import('@/types/resume').ResumeLayoutSettings
  ) => void;
  onSpacerResize?: (controlId: string, heightMm: number) => void;
}

export default function ContinuationPageLayout({
  data,
  blockIds,
  blocksById,
  onChange,
  hideContactInfo,
  onLayoutChange,
  onSpacerResize,
}: ContinuationPageLayoutProps) {
  const layout = normalizeLayoutSettings(data.layout);

  const handleLayoutChange = (
    updater: (layout: import('@/types/resume').ResumeLayoutSettings) => import('@/types/resume').ResumeLayoutSettings
  ) => {
    if (!onChange) return;
    onChange((current) => ({
      ...current,
      layout: updater(normalizeLayoutSettings(current.layout)),
    }));
  };

  const shared = {
    data,
    onChange,
    hideContactInfo,
    onLayoutChange: onLayoutChange ? handleLayoutChange : undefined,
    onSpacerResize,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {blockIds.map((id) => {
        const block = blocksById.get(id);
        if (!block) return null;
        const sectionStyle = block.section ? layout.sections?.[block.section] : undefined;
        return (
          <ResumeBlockRenderer
            key={id}
            block={block}
            {...shared}
            sectionMinHeightMm={sectionStyle?.minHeightMm}
          />
        );
      })}
    </div>
  );
}
