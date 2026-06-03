'use client';

import type { ComponentProps } from 'react';
import type { CoverPageSlice } from '@/lib/page-packer';
import type { ResumeBlock } from '@/lib/resume-blocks';
import type { ResumeData } from '@/types/resume';
import BlockColumn from '@/components/BlockColumn';
import ResumeBlockRenderer from '@/components/ResumeBlockRenderer';
import { normalizeLayoutSettings } from '@/lib/layout-settings';

interface CoverPageLayoutProps {
  data: ResumeData;
  cover: CoverPageSlice;
  blocksById: Map<string, ResumeBlock>;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
  onLayoutChange?: (
    updater: (layout: import('@/types/resume').ResumeLayoutSettings) => import('@/types/resume').ResumeLayoutSettings
  ) => void;
  onSpacerResize?: (controlId: string, heightMm: number) => void;
}

function renderBlocks(
  ids: string[],
  blocksById: Map<string, ResumeBlock>,
  props: Omit<React.ComponentProps<typeof ResumeBlockRenderer>, 'block'>
) {
  return ids.map((id) => {
    const block = blocksById.get(id);
    if (!block) return null;
    return <ResumeBlockRenderer key={id} block={block} {...props} />;
  });
}

export default function CoverPageLayout({
  data,
  cover,
  blocksById,
  onChange,
  hideContactInfo,
  onLayoutChange,
  onSpacerResize,
}: CoverPageLayoutProps) {
  const handleLayoutChange = (
    updater: (layout: import('@/types/resume').ResumeLayoutSettings) => import('@/types/resume').ResumeLayoutSettings
  ) => {
    if (!onChange) return;
    onChange((current) => ({
      ...current,
      layout: updater(normalizeLayoutSettings(current.layout)),
    }));
  };

  const shared: Omit<ComponentProps<typeof ResumeBlockRenderer>, 'block'> = {
    data,
    onChange,
    hideContactInfo,
    onLayoutChange: onChange ? handleLayoutChange : undefined,
    onSpacerResize,
  };

  return (
    <>
      {renderBlocks(cover.headerIds, blocksById, shared)}
      {(cover.leftIds.length > 0 || cover.rightIds.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', marginTop: 0 }}>
          <BlockColumn
            blockIds={cover.leftIds}
            blocksById={blocksById}
            columnGap="2rem"
            {...shared}
          />
          <BlockColumn blockIds={cover.rightIds} blocksById={blocksById} {...shared} />
        </div>
      )}
      {cover.fullIds.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <BlockColumn blockIds={cover.fullIds} blocksById={blocksById} {...shared} />
        </div>
      )}
    </>
  );
}
