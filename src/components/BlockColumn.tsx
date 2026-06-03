'use client';

import type { ComponentProps } from 'react';
import type { ResumeBlock } from '@/lib/resume-blocks';
import {
  BLOCK_COLUMN_GAP,
  BLOCK_SECTION_ENTRY_GAP,
  entryIdsFromGroup,
  groupBlockIdsForColumnGap,
} from '@/lib/block-column-layout';
import ResumeBlockRenderer from '@/components/ResumeBlockRenderer';
import { normalizeLayoutSettings } from '@/lib/layout-settings';
import type { ResumeData } from '@/types/resume';

type RendererProps = Omit<ComponentProps<typeof ResumeBlockRenderer>, 'block'>;

interface BlockColumnProps extends RendererProps {
  blockIds: string[];
  blocksById: Map<string, ResumeBlock>;
  data: ResumeData;
  columnGap?: string;
}

export default function BlockColumn({
  blockIds,
  blocksById,
  data,
  columnGap = BLOCK_COLUMN_GAP,
  ...rendererProps
}: BlockColumnProps) {
  const layout = normalizeLayoutSettings(data.layout);
  const groups = groupBlockIdsForColumnGap(blockIds, blocksById);

  const renderBlock = (id: string) => {
    const block = blocksById.get(id);
    if (!block) return null;
    const sectionStyle = block.section ? layout.sections?.[block.section] : undefined;
    return (
      <ResumeBlockRenderer
        key={id}
        block={block}
        data={data}
        sectionMinHeightMm={sectionStyle?.minHeightMm}
        {...rendererProps}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: columnGap }}>
      {groups.map((group) => {
        const headingId = group[0];
        const headingBlock = blocksById.get(headingId);
        if (headingBlock?.kind === 'sectionHeading') {
          const entryIds = entryIdsFromGroup(group, blocksById);
          return (
            <div key={headingId}>
              {renderBlock(headingId)}
              {entryIds.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: BLOCK_SECTION_ENTRY_GAP,
                  }}
                >
                  {entryIds.map((id) => renderBlock(id))}
                </div>
              )}
            </div>
          );
        }

        if (group.length === 1) {
          return renderBlock(group[0]);
        }

        return (
          <div
            key={group[0]}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: BLOCK_SECTION_ENTRY_GAP,
            }}
          >
            {group.map((id) => renderBlock(id))}
          </div>
        );
      })}
    </div>
  );
}
