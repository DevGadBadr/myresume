import test from 'node:test';
import assert from 'node:assert/strict';
import type { ResumeBlock } from '../src/lib/resume-blocks.ts';
import {
  groupBlockIdsForColumnGap,
  measureColumnLayoutHeight,
  remToPx,
  BLOCK_COLUMN_GAP,
  BLOCK_SECTION_ENTRY_GAP,
} from '../src/lib/block-column-layout.ts';

function block(id: string, kind: ResumeBlock['kind'], section?: ResumeBlock['section']): ResumeBlock {
  return {
    id,
    kind,
    column: 'left',
    section,
  };
}

test('groupBlockIdsForColumnGap keeps section heading with its entries', () => {
  const blocksById = new Map<string, ResumeBlock>([
    ['h', block('h', 'sectionHeading', 'experience')],
    ['e1', block('e1', 'experienceEntry', 'experience')],
    ['e2', block('e2', 'experienceEntry', 'experience')],
  ]);
  assert.deepEqual(groupBlockIdsForColumnGap(['h', 'e1', 'e2'], blocksById), [['h', 'e1', 'e2']]);
});

test('groupBlockIdsForColumnGap separates distinct sections', () => {
  const blocksById = new Map<string, ResumeBlock>([
    ['h1', block('h1', 'sectionHeading', 'experience')],
    ['e1', block('e1', 'experienceEntry', 'experience')],
    ['h2', block('h2', 'sectionHeading', 'certificates')],
    ['c1', block('c1', 'certificateEntry', 'certificates')],
  ]);
  assert.deepEqual(groupBlockIdsForColumnGap(['h1', 'e1', 'h2', 'c1'], blocksById), [
    ['h1', 'e1'],
    ['h2', 'c1'],
  ]);
});

test('groupBlockIdsForColumnGap groups continuation entries without a heading', () => {
  const blocksById = new Map<string, ResumeBlock>([
    ['e1', block('e1', 'experienceEntry', 'experience')],
    ['e2', block('e2', 'experienceEntry', 'experience')],
  ]);
  assert.deepEqual(groupBlockIdsForColumnGap(['e1', 'e2'], blocksById), [['e1', 'e2']]);
});

test('measureColumnLayoutHeight includes column and entry gaps', () => {
  const blocksById = new Map<string, ResumeBlock>([
    ['h', block('h', 'sectionHeading', 'projects')],
    ['p1', block('p1', 'projectEntry', 'projects')],
  ]);
  const heights = new Map([
    ['h', 30],
    ['p1', 50],
  ]);
  const total = measureColumnLayoutHeight(['h', 'p1'], blocksById, heights);
  assert.equal(total, 30 + remToPx(BLOCK_SECTION_ENTRY_GAP) + 50);
  assert.ok(total > 80);
});

test('measureColumnLayoutHeight adds column gap between section groups', () => {
  const blocksById = new Map<string, ResumeBlock>([
    ['h1', block('h1', 'sectionHeading', 'experience')],
    ['e1', block('e1', 'experienceEntry', 'experience')],
    ['h2', block('h2', 'sectionHeading', 'projects')],
    ['p1', block('p1', 'projectEntry', 'projects')],
  ]);
  const heights = new Map([
    ['h1', 20],
    ['e1', 40],
    ['h2', 20],
    ['p1', 40],
  ]);
  const total = measureColumnLayoutHeight(['h1', 'e1', 'h2', 'p1'], blocksById, heights);
  const expected =
    20 +
    remToPx(BLOCK_SECTION_ENTRY_GAP) +
    40 +
    remToPx(BLOCK_COLUMN_GAP) +
    20 +
    remToPx(BLOCK_SECTION_ENTRY_GAP) +
    40;
  assert.equal(total, expected);
});
