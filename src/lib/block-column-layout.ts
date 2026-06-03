import type { ResumeBlock } from '@/lib/resume-blocks';

/** Gap between major blocks/sections in a column (matches ResumeDocument). */
export const BLOCK_COLUMN_GAP = '1.75rem';

/** Gap between entries within the same section (matches Tailwind space-y-5). */
export const BLOCK_SECTION_ENTRY_GAP = '1.25rem';

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
