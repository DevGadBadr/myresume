import { PAGE_CONTENT_MM, pageContentHeightMm, resolvePageMargins } from '@/lib/page-layout';
import {
  buildBlockStream,
  continuationQueue,
  splitBlockStreams,
  type BlockColumn,
  type ResumeBlock,
} from '@/lib/resume-blocks';
import type { ResumeData, ResumeLayoutSettings } from '@/types/resume';
import { DEFAULT_LAYOUT_SETTINGS } from '@/types/resume';

const MM_TO_PX = 96 / 25.4;

export function mmToPx(mm: number) {
  return mm * MM_TO_PX;
}

export function pxToMm(px: number) {
  return px / MM_TO_PX;
}

export interface CoverPageSlice {
  headerIds: string[];
  leftIds: string[];
  rightIds: string[];
  fullIds: string[];
}

export interface PageAssignment {
  layout: 'cover' | 'continuation';
  blockIds: string[];
  cover?: CoverPageSlice;
}

function blockHeight(block: ResumeBlock, heights: Map<string, number>): number {
  if (block.kind === 'spacer') {
    return mmToPx(block.heightMm ?? 8);
  }
  if (block.kind === 'pageBreak') {
    return 0;
  }
  return heights.get(block.id) ?? 0;
}

function isPageBreak(block: ResumeBlock) {
  return block.kind === 'pageBreak';
}

function gridHeight(leftPx: number, rightPx: number) {
  return Math.max(leftPx, rightPx);
}

function packHeaderStream(
  blocks: ResumeBlock[],
  heights: Map<string, number>,
  budgetPx: number
): { placed: ResumeBlock[]; remaining: ResumeBlock[]; usedPx: number } {
  const placed: ResumeBlock[] = [];
  let usedPx = 0;
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];
    if (isPageBreak(block)) {
      return { placed, remaining: blocks.slice(index), usedPx };
    }

    const height = blockHeight(block, heights);
    if (placed.length > 0 && usedPx + height > budgetPx + 0.5) {
      break;
    }
    if (placed.length === 0 && height > budgetPx + 0.5 && block.kind !== 'spacer') {
      placed.push(block);
      usedPx += height;
      index += 1;
      break;
    }
    if (usedPx + height > budgetPx + 0.5) {
      break;
    }

    placed.push(block);
    usedPx += height;
    index += 1;
  }

  return { placed, remaining: blocks.slice(index), usedPx };
}

function packCoverGrid(
  leftBlocks: ResumeBlock[],
  rightBlocks: ResumeBlock[],
  heights: Map<string, number>,
  gridBudgetPx: number
): {
  leftPlaced: ResumeBlock[];
  rightPlaced: ResumeBlock[];
  leftRemaining: ResumeBlock[];
  rightRemaining: ResumeBlock[];
  gridUsedPx: number;
} {
  let leftQueue = [...leftBlocks];
  let rightQueue = [...rightBlocks];
  const leftPlaced: ResumeBlock[] = [];
  const rightPlaced: ResumeBlock[] = [];
  let leftUsed = 0;
  let rightUsed = 0;

  while (leftQueue.length > 0 || rightQueue.length > 0) {
    if (leftQueue[0] && isPageBreak(leftQueue[0])) {
      return {
        leftPlaced,
        rightPlaced,
        leftRemaining: leftQueue,
        rightRemaining: rightQueue,
        gridUsedPx: gridHeight(leftUsed, rightUsed),
      };
    }
    if (rightQueue[0] && isPageBreak(rightQueue[0])) {
      return {
        leftPlaced,
        rightPlaced,
        leftRemaining: leftQueue,
        rightRemaining: rightQueue,
        gridUsedPx: gridHeight(leftUsed, rightUsed),
      };
    }

    const leftHead = leftQueue[0];
    const rightHead = rightQueue[0];
    const leftHeight = leftHead ? blockHeight(leftHead, heights) : Infinity;
    const rightHeight = rightHead ? blockHeight(rightHead, heights) : Infinity;
    const leftFits =
      leftHead &&
      gridHeight(leftUsed + leftHeight, rightUsed) <= gridBudgetPx + 0.5;
    const rightFits =
      rightHead &&
      gridHeight(leftUsed, rightUsed + rightHeight) <= gridBudgetPx + 0.5;

    if (!leftFits && !rightFits) {
      break;
    }

    const preferLeft =
      leftFits && (!rightFits || leftHeight <= rightHeight);

    if (preferLeft && leftHead) {
      leftPlaced.push(leftHead);
      leftUsed += leftHeight;
      leftQueue = leftQueue.slice(1);
    } else if (rightHead && rightFits) {
      rightPlaced.push(rightHead);
      rightUsed += rightHeight;
      rightQueue = rightQueue.slice(1);
    } else {
      break;
    }
  }

  return {
    leftPlaced,
    rightPlaced,
    leftRemaining: leftQueue,
    rightRemaining: rightQueue,
    gridUsedPx: gridHeight(leftUsed, rightUsed),
  };
}

function packFullOnCover(
  fullBlocks: ResumeBlock[],
  heights: Map<string, number>,
  budgetPx: number
): { placed: ResumeBlock[]; remaining: ResumeBlock[] } {
  const placed: ResumeBlock[] = [];
  let used = 0;
  let index = 0;

  while (index < fullBlocks.length) {
    const block = fullBlocks[index];
    if (isPageBreak(block)) {
      return { placed, remaining: fullBlocks.slice(index) };
    }
    const height = blockHeight(block, heights);
    if (used > 0 && used + height > budgetPx + 0.5) {
      break;
    }
    if (used === 0 && height > budgetPx + 0.5 && block.kind !== 'spacer') {
      placed.push(block);
      index += 1;
      break;
    }
    if (used + height > budgetPx + 0.5) {
      break;
    }
    placed.push(block);
    used += height;
    index += 1;
  }

  return { placed, remaining: fullBlocks.slice(index) };
}

function packContinuationPage(
  queue: ResumeBlock[],
  heights: Map<string, number>,
  pageBudgetPx: number
): { placed: ResumeBlock[]; remaining: ResumeBlock[] } {
  const placed: ResumeBlock[] = [];
  let used = 0;
  let index = 0;

  while (index < queue.length) {
    const block = queue[index];
    if (isPageBreak(block)) {
      return { placed, remaining: queue.slice(index + 1) };
    }
    const height = blockHeight(block, heights);
    if (placed.length > 0 && used + height > pageBudgetPx + 0.5) {
      break;
    }
    if (placed.length === 0 && height > pageBudgetPx + 0.5 && block.kind !== 'spacer') {
      placed.push(block);
      return { placed, remaining: queue.slice(index + 1) };
    }
    if (used + height > pageBudgetPx + 0.5) {
      break;
    }
    placed.push(block);
    used += height;
    index += 1;
  }

  return { placed, remaining: queue.slice(index) };
}

function toCoverAssignment(slice: CoverPageSlice): PageAssignment {
  return {
    layout: 'cover',
    blockIds: [...slice.headerIds, ...slice.leftIds, ...slice.rightIds, ...slice.fullIds],
    cover: slice,
  };
}

function toContinuationAssignment(blockIds: string[]): PageAssignment {
  return { layout: 'continuation', blockIds };
}

export function packBlocksIntoPages(
  blocks: ResumeBlock[],
  heights: Map<string, number>,
  pageContentMm: number = PAGE_CONTENT_MM
): PageAssignment[] {
  const pageBudgetPx = mmToPx(pageContentMm);
  const { headerBlocks, leftBlocks, rightBlocks, fullBlocks } = splitBlockStreams(blocks);

  const pages: PageAssignment[] = [];

  const headerPack = packHeaderStream(headerBlocks, heights, pageBudgetPx);
  const headerUsedPx = headerPack.usedPx;
  const gridBudgetPx = Math.max(0, pageBudgetPx - headerUsedPx);
  const gridPack = packCoverGrid(leftBlocks, rightBlocks, heights, gridBudgetPx);
  const gridUsedPx = gridPack.gridUsedPx;
  const fullBudgetPx = Math.max(0, pageBudgetPx - headerUsedPx - gridUsedPx);
  const fullPack = packFullOnCover(fullBlocks, heights, fullBudgetPx);

  const cover: CoverPageSlice = {
    headerIds: headerPack.placed.map((block) => block.id),
    leftIds: gridPack.leftPlaced.map((block) => block.id),
    rightIds: gridPack.rightPlaced.map((block) => block.id),
    fullIds: fullPack.placed.map((block) => block.id),
  };

  if (
    cover.headerIds.length > 0 ||
    cover.leftIds.length > 0 ||
    cover.rightIds.length > 0 ||
    cover.fullIds.length > 0
  ) {
    pages.push(toCoverAssignment(cover));
  }

  let headerRemainder = headerPack.remaining;
  if (headerRemainder[0] && isPageBreak(headerRemainder[0])) {
    headerRemainder = headerRemainder.slice(1);
  }

  let queue = [
    ...headerRemainder,
    ...continuationQueue(gridPack.leftRemaining, gridPack.rightRemaining, fullPack.remaining),
  ];
  while (queue.length > 0) {
    if (isPageBreak(queue[0])) {
      queue = queue.slice(1);
      continue;
    }
    const packed = packContinuationPage(queue, heights, pageBudgetPx);
    if (packed.placed.length === 0 && queue[0]) {
      pages.push(toContinuationAssignment([queue[0].id]));
      queue = queue.slice(1);
      continue;
    }
    pages.push(toContinuationAssignment(packed.placed.map((block) => block.id)));
    queue = packed.remaining;
  }

  if (pages.length === 0) {
    pages.push({
      layout: 'cover',
      blockIds: [],
      cover: { headerIds: [], leftIds: [], rightIds: [], fullIds: [] },
    });
  }

  return pages;
}

export function packResumeIntoPages(
  data: ResumeData,
  heights: Map<string, number>,
  layout: ResumeLayoutSettings = DEFAULT_LAYOUT_SETTINGS
): PageAssignment[] {
  const blocks = buildBlockStream(data, layout);
  const contentMm = pageContentHeightMm(resolvePageMargins(layout));
  return packBlocksIntoPages(blocks, heights, contentMm);
}

export function columnForBlockId(
  blocks: ResumeBlock[],
  blockId: string
): BlockColumn | undefined {
  return blocks.find((block) => block.id === blockId)?.column;
}
