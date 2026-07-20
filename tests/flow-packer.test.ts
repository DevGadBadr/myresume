import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFlowBlocks } from '../src/lib/flow-blocks.ts';
import { packFlowBlocks } from '../src/lib/flow-packer.ts';
import { CLASSIC_LAYOUT } from '../src/layouts/index.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';

test('buildFlowBlocks keeps entries atomic and headings keepWithNext', () => {
  const blocks = buildFlowBlocks(DEFAULT_RESUME_DATA, CLASSIC_LAYOUT);
  assert.equal(blocks[0].kind, 'header');
  const projectHeading = blocks.find((block) => block.id === 'heading-projects');
  assert.equal(projectHeading?.keepWithNext, true);
  assert.ok(blocks.some((block) => block.kind === 'project'));
});

test('packFlowBlocks never splits a tall block across pages', () => {
  const blocks = [
    { id: 'a', kind: 'about' as const },
    { id: 'b', kind: 'project' as const, entryId: '1' },
    { id: 'c', kind: 'project' as const, entryId: '2' },
  ];
  const heights = new Map([
    ['a', 100],
    ['b', 400],
    ['c', 100],
  ]);
  const pages = packFlowBlocks(blocks, heights, 500);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].blockIds, ['a', 'b']);
  assert.deepEqual(pages[1].blockIds, ['c']);
});

test('packFlowBlocks moves heading with following entry instead of orphaning', () => {
  const withFiller = [
    { id: 'filler', kind: 'about' as const },
    { id: 'h', kind: 'heading' as const, section: 'projects' as const, keepWithNext: true },
    { id: 'p1', kind: 'project' as const, entryId: '1' },
  ];
  const heights2 = new Map([
    ['filler', 450],
    ['h', 40],
    ['p1', 200],
  ]);
  const pages = packFlowBlocks(withFiller, heights2, 500);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].blockIds, ['filler']);
  assert.deepEqual(pages[1].blockIds, ['h', 'p1']);
});

test('packFlowBlocks respects pageBreakBefore', () => {
  const blocks = [
    { id: 'a', kind: 'about' as const },
    { id: 'b', kind: 'project' as const, entryId: '1', pageBreakBefore: true },
  ];
  const heights = new Map([
    ['a', 50],
    ['b', 50],
  ]);
  const pages = packFlowBlocks(blocks, heights, 500);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].blockIds, ['a']);
  assert.deepEqual(pages[1].blockIds, ['b']);
});
