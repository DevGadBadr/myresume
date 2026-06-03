'use client';

import type { ResumeBlock } from '@/lib/resume-blocks';
import type { ResumeData } from '@/types/resume';
import BlockColumn from '@/components/BlockColumn';
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

  return <BlockColumn blockIds={blockIds} blocksById={blocksById} {...shared} />;
}
