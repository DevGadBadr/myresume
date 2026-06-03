import test from 'node:test';
import assert from 'node:assert/strict';
import type { ResumeBlock } from '../src/lib/resume-blocks.ts';
import { groupBlockIdsForColumnGap } from '../src/lib/block-column-layout.ts';

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
