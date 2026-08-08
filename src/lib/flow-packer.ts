import type { FlowBlock } from '@/lib/flow-blocks';

export interface PackedPage {
  blockIds: string[];
}

export interface PackFlowBlocksOptions {
  /** Flex gap between stacked blocks (e.g. 0.85rem), in CSS pixels. */
  gapPx?: number;
}

/**
 * Pack atomic blocks into pages. Never splits a block.
 * Headings marked keepWithNext are never left alone at the bottom of a page.
 */
export function packFlowBlocks(
  blocks: FlowBlock[],
  heights: Map<string, number>,
  contentHeightPx: number,
  options: PackFlowBlocksOptions = {}
): PackedPage[] {
  const gapPx = Math.max(0, options.gapPx ?? 0);

  if (blocks.length === 0) {
    return [{ blockIds: [] }];
  }

  const pages: PackedPage[] = [{ blockIds: [] }];
  const byId = new Map(blocks.map((block) => [block.id, block]));

  const heightOf = (id: string) => Math.max(0, heights.get(id) ?? 0);

  const usedHeight = (ids: string[]) => {
    if (ids.length === 0) {
      return 0;
    }
    let sum = 0;
    for (const id of ids) {
      sum += heightOf(id);
    }
    return sum + (ids.length - 1) * gapPx;
  };

  const combinedHeight = (existingIds: string[], next: FlowBlock[]) =>
    usedHeight([...existingIds, ...next.map((block) => block.id)]);

  const flushLonelyHeadings = (page: PackedPage): FlowBlock[] => {
    const pushed: FlowBlock[] = [];
    while (page.blockIds.length > 0) {
      const lastId = page.blockIds[page.blockIds.length - 1];
      const last = byId.get(lastId);
      if (!last?.keepWithNext) break;
      page.blockIds.pop();
      pushed.unshift(last);
    }
    return pushed;
  };

  const startNewPage = (seed: FlowBlock[] = []) => {
    pages.push({ blockIds: seed.map((block) => block.id) });
  };

  let pendingKeep: FlowBlock[] = [];

  for (const block of blocks) {
    if (block.keepWithNext) {
      pendingKeep.push(block);
      continue;
    }

    const group = [...pendingKeep, block];
    pendingKeep = [];
    const current = pages[pages.length - 1];
    const forceBreak = Boolean(block.pageBreakBefore) && current.blockIds.length > 0;
    const fits = combinedHeight(current.blockIds, group) <= contentHeightPx + 0.5;

    if ((!fits && current.blockIds.length > 0) || forceBreak) {
      const lonely = flushLonelyHeadings(current);
      startNewPage([...lonely, ...group]);
      continue;
    }

    // Oversized group on an empty page: still place whole group (never clip).
    for (const item of group) {
      current.blockIds.push(item.id);
    }
  }

  if (pendingKeep.length > 0) {
    const current = pages[pages.length - 1];
    if (combinedHeight(current.blockIds, pendingKeep) > contentHeightPx + 0.5 && current.blockIds.length > 0) {
      const lonely = flushLonelyHeadings(current);
      startNewPage([...lonely, ...pendingKeep]);
    } else {
      for (const item of pendingKeep) {
        current.blockIds.push(item.id);
      }
    }
  }

  // Drop trailing empty pages
  while (pages.length > 1 && pages[pages.length - 1].blockIds.length === 0) {
    pages.pop();
  }

  return pages;
}
