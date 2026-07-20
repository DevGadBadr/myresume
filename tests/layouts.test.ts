import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLayoutDefinition,
  normalizeLayoutId,
  resolveDocumentLayoutId,
  RESUME_LAYOUTS,
} from '../src/layouts/index.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';
import { assembleTemplateResume } from '../src/lib/template-content.ts';
import { tryNormalizeResumeData } from '../src/lib/resume-validation.ts';

test('normalizeLayoutId falls back to classic', () => {
  assert.equal(normalizeLayoutId(undefined), 'classic');
  assert.equal(normalizeLayoutId('nope'), 'classic');
  assert.equal(normalizeLayoutId('split'), 'split');
});

test('classic layout is single column with expected section order', () => {
  const layout = getLayoutDefinition('classic');
  assert.equal(layout.columns, 1);
  assert.deepEqual(
    layout.sections.map((item) => item.section),
    ['about', 'experience', 'projects', 'education', 'certificates', 'skills']
  );
});

test('split layout places experience on the left and education on the right', () => {
  const layout = getLayoutDefinition('split');
  assert.equal(layout.columns, 2);
  const experience = layout.sections.find((item) => item.section === 'experience');
  const education = layout.sections.find((item) => item.section === 'education');
  assert.equal(experience?.column, 'left');
  assert.equal(education?.column, 'right');
});

test('compact layout uses dense density', () => {
  assert.equal(RESUME_LAYOUTS.compact.density, 'compact');
});

test('resolveDocumentLayoutId prefers template layoutId', () => {
  const data = {
    ...DEFAULT_RESUME_DATA,
    layoutId: 'classic' as const,
  };
  const template = {
    ...data.templates[0],
    layoutId: 'split' as const,
  };
  assert.equal(resolveDocumentLayoutId(data, { template }), 'split');
  assert.equal(resolveDocumentLayoutId(data), 'classic');
});

test('assembleTemplateResume carries layoutId onto the assembled document', () => {
  const root = DEFAULT_RESUME_DATA;
  const template = { ...root.templates[0], layoutId: 'compact' as const };
  const assembled = assembleTemplateResume(root, template);
  assert.equal(assembled.layoutId, 'compact');
});

test('normalizeResumeData accepts layoutId and pageBreakBefore', () => {
  const result = tryNormalizeResumeData({
    ...DEFAULT_RESUME_DATA,
    layoutId: 'split',
    experience: DEFAULT_RESUME_DATA.experience.map((entry, index) =>
      index === 0 ? { ...entry, pageBreakBefore: true } : entry
    ),
    templates: DEFAULT_RESUME_DATA.templates.map((template) => ({
      ...template,
      layoutId: 'compact',
    })),
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.layoutId, 'split');
  assert.equal(result.data.experience[0].pageBreakBefore, true);
  assert.equal(result.data.templates[0].layoutId, 'compact');
});
