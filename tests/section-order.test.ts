import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSIC_LAYOUT } from '../src/layouts/index.ts';
import {
  moveSectionInOrder,
  resolveSectionOrder,
  sectionOrderFromData,
} from '../src/lib/section-order.ts';
import { buildFlowBlocks } from '../src/lib/flow-blocks.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';
import type { SectionKey } from '../src/types/resume.ts';

test('resolveSectionOrder falls back to layout default', () => {
  const order = resolveSectionOrder(undefined, CLASSIC_LAYOUT);
  assert.deepEqual(order, [
    'about',
    'experience',
    'projects',
    'education',
    'certificates',
    'skills',
  ]);
});

test('resolveSectionOrder applies custom order and appends missing', () => {
  const order = resolveSectionOrder(
    ['certificates', 'education', 'about'],
    CLASSIC_LAYOUT
  );
  assert.deepEqual(order, [
    'certificates',
    'education',
    'about',
    'experience',
    'projects',
    'skills',
  ]);
});

test('moveSectionInOrder swaps neighbors', () => {
  const order = ['about', 'experience', 'projects'] as const;
  assert.deepEqual(moveSectionInOrder([...order], 'experience', 'up'), [
    'experience',
    'about',
    'projects',
  ]);
  assert.deepEqual(moveSectionInOrder([...order], 'experience', 'down'), [
    'about',
    'projects',
    'experience',
  ]);
});

test('buildFlowBlocks respects data.sectionOrder', () => {
  const sectionOrder = [
    'certificates',
    'education',
    'about',
    'experience',
    'projects',
    'skills',
  ] as SectionKey[];
  const data = {
    ...DEFAULT_RESUME_DATA,
    sectionOrder,
  };
  const blocks = buildFlowBlocks(data, CLASSIC_LAYOUT);
  const headings = blocks.filter((block) => block.kind === 'heading').map((block) => block.section);
  assert.deepEqual(headings, sectionOrder);
  assert.deepEqual(sectionOrderFromData(data, CLASSIC_LAYOUT)[0], 'certificates');
});
