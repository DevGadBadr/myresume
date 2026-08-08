import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePrintResume } from '@/lib/pdf/resolve-print-resume';
import { DEFAULT_RESUME_DATA } from '@/lib/defaultData';

test('resolvePrintResume library returns full resume without contact hide', () => {
  const resolved = resolvePrintResume(DEFAULT_RESUME_DATA, 'library');
  assert.equal(resolved.hideContactInfo, false);
  assert.equal(resolved.data.personalInfo.name, DEFAULT_RESUME_DATA.personalInfo.name);
  assert.ok(resolved.data.experience.length >= DEFAULT_RESUME_DATA.experience.length);
});

test('resolvePrintResume template assembles active variant', () => {
  const template = DEFAULT_RESUME_DATA.templates[0];
  assert.ok(template);
  const resolved = resolvePrintResume(DEFAULT_RESUME_DATA, 'template', template.id);
  assert.equal(resolved.hideContactInfo, template.hideContactInfo);
  assert.equal(resolved.data.layoutId, template.layoutId ?? DEFAULT_RESUME_DATA.layoutId);
});
