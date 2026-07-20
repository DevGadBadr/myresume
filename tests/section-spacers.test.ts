import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustSectionSpacer,
  clampSpacerLines,
  getSpacerLinesAfter,
  normalizeSectionSpacers,
  removeSectionSpacer,
  upsertSectionSpacer,
} from '../src/lib/section-spacers.ts';
import { buildFlowBlocks } from '../src/lib/flow-blocks.ts';
import { CLASSIC_LAYOUT } from '../src/layouts/index.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';

test('clampSpacerLines bounds values', () => {
  assert.equal(clampSpacerLines(0), 1);
  assert.equal(clampSpacerLines(3.6), 4);
  assert.equal(clampSpacerLines(100), 24);
});

test('normalizeSectionSpacers dedupes by section', () => {
  const spacers = normalizeSectionSpacers([
    { afterSection: 'education', lines: 2 },
    { afterSection: 'education', lines: 5 },
    { afterSection: 'bad', lines: 2 },
  ]);
  assert.deepEqual(spacers, [{ afterSection: 'education', lines: 5 }]);
});

test('adjustSectionSpacer adds removes and clears', () => {
  let spacers = adjustSectionSpacer({}, 'projects', 1);
  assert.equal(getSpacerLinesAfter(spacers, 'projects'), 1);
  spacers = adjustSectionSpacer({ sectionSpacers: spacers }, 'projects', 2);
  assert.equal(getSpacerLinesAfter(spacers, 'projects'), 3);
  spacers = removeSectionSpacer(spacers, 'projects');
  assert.equal(spacers, undefined);
});

test('buildFlowBlocks inserts spacer blocks between sections', () => {
  const data = {
    ...DEFAULT_RESUME_DATA,
    sectionSpacers: [{ afterSection: 'experience' as const, lines: 3 }],
  };
  const blocks = buildFlowBlocks(data, CLASSIC_LAYOUT);
  const spacer = blocks.find((block) => block.kind === 'spacer');
  assert.equal(spacer?.section, 'experience');
  assert.equal(spacer?.spacerLines, 3);
  assert.ok(upsertSectionSpacer(undefined, 'about', 2).length === 1);
});
