import type { ResumeBlock } from '@/lib/resume-blocks';

/** Gap between major blocks/sections in a column (matches ResumeDocument). */
export const BLOCK_COLUMN_GAP = '1.75rem';

/** Gap between entries within the same section (matches Tailwind space-y-5). */
export const BLOCK_SECTION_ENTRY_GAP = '1.25rem';

/** Top margin before the full-width column on the cover page (CoverPageLayout). */
export const COVER_FULL_COLUMN_MARGIN = '2rem';

const ROOT_FONT_PX = 16;

export function remToPx(remValue: string, rootPx = ROOT_FONT_PX): number {
  const match = remValue.trim().match(/^([\d.]+)rem$/);
  if (!match) return 0;
  return parseFloat(match[1]) * rootPx;
}

/**
 * Total rendered height for a column slice, including group/entry gaps used by BlockColumn.
 */
export function measureColumnLayoutHeight(
  blockIds: string[],
  blocksById: Map<string, ResumeBlock>,
  heights: Map<string, number>,
  columnGap: string = BLOCK_COLUMN_GAP
): number {
  if (blockIds.length === 0) return 0;

  const groups = groupBlockIdsForColumnGap(blockIds, blocksById);
  let total = 0;

  for (let gi = 0; gi < groups.length; gi++) {
    if (gi > 0) {
      total += remToPx(columnGap);
    }

    const group = groups[gi];
    const headingBlock = blocksById.get(group[0]);
    if (headingBlock?.kind === 'sectionHeading') {
      total += heights.get(group[0]) ?? 0;
      const entryIds = entryIdsFromGroup(group, blocksById);
      if (entryIds.length === 0) continue;

      total += remToPx(BLOCK_SECTION_ENTRY_GAP);
      for (let ei = 0; ei < entryIds.length; ei++) {
        if (ei > 0) total += remToPx(BLOCK_SECTION_ENTRY_GAP);
        total += heights.get(entryIds[ei]) ?? 0;
      }
      continue;
    }

    for (let bi = 0; bi < group.length; bi++) {
      if (bi > 0) total += remToPx(BLOCK_SECTION_ENTRY_GAP);
      total += heights.get(group[bi]) ?? 0;
    }
  }

  return total;
}

function isSectionHeadingGroup(blocksById: Map<string, ResumeBlock>, ids: string[]): boolean {
  const first = blocksById.get(ids[0]);
  return first?.kind === 'sectionHeading';
}

/**
 * Groups block ids so a section heading stays with its entries without the full column gap
 * between the title and the first item.
 */
export function groupBlockIdsForColumnGap(
  blockIds: string[],
  blocksById: Map<string, ResumeBlock>
): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      groups.push(current);
      current = [];
    }
  };

  for (const id of blockIds) {
    const block = blocksById.get(id);
    if (!block) continue;

    if (block.kind === 'sectionHeading') {
      flush();
      current = [id];
      continue;
    }

    const head = current[0] ? blocksById.get(current[0]) : undefined;
    if (head?.kind === 'sectionHeading' && block.section === head.section) {
      current.push(id);
      continue;
    }

    if (
      current.length > 0 &&
      !isSectionHeadingGroup(blocksById, current) &&
      block.section &&
      current.every((cid) => blocksById.get(cid)?.section === block.section)
    ) {
      current.push(id);
      continue;
    }

    flush();
    current = [id];
  }

  flush();
  return groups;
}

export function entryIdsFromGroup(
  group: string[],
  blocksById: Map<string, ResumeBlock>
): string[] {
  if (!isSectionHeadingGroup(blocksById, group)) {
    return group;
  }
  return group.slice(1);
}
