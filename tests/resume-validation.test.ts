import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from '../src/lib/auth-token.ts';
import {
  buildContentFromLegacySelection,
  normalizeResumeData,
  tryNormalizeResumeData,
} from '../src/lib/resume-validation.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';
import { normalizeLayoutSettings } from '../src/lib/layout-settings.ts';

process.env.AUTH_SECRET ??= 'test-secret';
process.env.ADMIN_USERNAME ??= 'admin';
process.env.ADMIN_PASSWORD ??= 'password';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/resume-test';

test('normalizeResumeData trims and preserves the expected shape', () => {
  const normalized = normalizeResumeData({
    ...DEFAULT_RESUME_DATA,
    about: ` ${DEFAULT_RESUME_DATA.about} `,
    skills: [' TypeScript ', 'React'],
    projects: DEFAULT_RESUME_DATA.projects.map((project, index) =>
      index === 0
        ? {
            ...project,
            deployment: {
              url: ' https://demo.example.com/app ',
              credentials: [
                { id: ' login-email ', label: ' Email ', value: ' tester@example.com ' },
                { id: ' login-password ', label: ' Password ', value: ' secret ' },
              ],
            },
          }
        : project
    ),
  });

  assert.equal(normalized.about, DEFAULT_RESUME_DATA.about);
  assert.deepEqual(normalized.skills, [
    { id: 'skill-typescript', label: 'TypeScript' },
    { id: 'skill-react', label: 'React' },
  ]);
  assert.equal(normalized.templates[0].name, 'Default Resume');
  assert.ok(normalized.templates[0].content);
  assert.equal(normalized.templates[0].content.experience.length, DEFAULT_RESUME_DATA.experience.length);
  assert.equal(normalized.templates[1].hideContactInfo, true);
  assert.ok(normalized.templates[1].content);
  assert.equal('selected' in normalized.templates[0], false);
  assert.deepEqual(normalized.layout?.controls ?? [], []);
  assert.ok(normalized.templates[0].content.layout);
  assert.deepEqual(normalized.projects[0].deployment, {
    url: 'https://demo.example.com/app',
    credentials: [
      { id: 'login-email', label: 'Email', value: 'tester@example.com' },
      { id: 'login-password', label: 'Password', value: 'secret' },
    ],
  });
});

test('normalizeResumeData migrates legacy template selection into content', () => {
  const library = {
    personalInfo: DEFAULT_RESUME_DATA.personalInfo,
    about: DEFAULT_RESUME_DATA.about,
    experience: DEFAULT_RESUME_DATA.experience,
    projects: DEFAULT_RESUME_DATA.projects,
    skills: DEFAULT_RESUME_DATA.skills,
    education: DEFAULT_RESUME_DATA.education,
    certificates: DEFAULT_RESUME_DATA.certificates,
  };

  const normalized = normalizeResumeData({
    ...library,
    templates: [
      {
        id: 'legacy-upwork',
        name: 'Legacy Upwork',
        hideContactInfo: true,
        summaryOverride: '  Custom summary for Upwork  ',
        selected: {
          experienceIds: ['1'],
          experienceBulletIndexes: { '1': [0, 2] },
          projectIds: ['2'],
          skillIds: ['skill-python', 'skill-react'],
          educationIds: ['1'],
          certificateIds: ['2'],
        },
      },
    ],
  });

  const template = normalized.templates[0];
  assert.ok(template.content);
  assert.equal(template.content.about, 'Custom summary for Upwork');
  assert.equal(template.content.experience.length, 1);
  assert.equal(template.content.experience[0].id, '1');
  assert.equal(template.content.experience[0].bullets.length, 2);
  assert.equal(template.content.projects.length, 1);
  assert.equal(template.content.projects[0].id, '2');
  assert.equal(template.content.skills.length, 2);
  assert.equal(template.content.certificates.length, 1);
  assert.equal(template.content.certificates[0].id, '2');
  assert.equal('selected' in template, false);
  assert.equal('summaryOverride' in template, false);
});

test('buildContentFromLegacySelection filters bullets by index map', () => {
  const content = buildContentFromLegacySelection(DEFAULT_RESUME_DATA, {
    id: 'x',
    name: 'x',
    hideContactInfo: false,
    selected: {
      experienceIds: ['1'],
      experienceBulletIndexes: { '1': [1] },
      projectIds: [],
      skillIds: [],
      educationIds: [],
      certificateIds: [],
    },
  });

  assert.equal(content.experience[0].bullets.length, 1);
  assert.equal(
    content.experience[0].bullets[0],
    DEFAULT_RESUME_DATA.experience[0].bullets[1]
  );
});

test('tryNormalizeResumeData rejects malformed payloads', () => {
  const result = tryNormalizeResumeData({
    ...DEFAULT_RESUME_DATA,
    projects: 'not-an-array',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /projects must be an array/);
  }
});

test('normalizeResumeData normalizes layout controls', () => {
  const normalized = normalizeResumeData({
    ...DEFAULT_RESUME_DATA,
    layout: {
      controls: [
        {
          id: 'spacer-1',
          type: 'spacer',
          anchor: { kind: 'afterHeader' },
          heightMm: 12,
        },
      ],
      sections: {
        experience: { minHeightMm: 20 },
      },
    },
  });

  assert.equal(normalized.layout?.controls.length, 1);
  assert.equal(normalized.layout?.controls[0].heightMm, 12);
  assert.equal(normalized.layout?.sections?.experience?.minHeightMm, 20);
  assert.deepEqual(normalizeLayoutSettings(null).controls, []);
});

test('session tokens validate signature and expiry', () => {
  const token = createSessionToken(process.env.AUTH_SECRET!, 'admin', Date.now() + 60_000);
  assert.equal(verifySessionToken(process.env.AUTH_SECRET!, token), true);
  assert.equal(verifySessionToken(process.env.AUTH_SECRET!, `${token}broken`), false);
  assert.equal(
    verifySessionToken(
      process.env.AUTH_SECRET!,
      createSessionToken(process.env.AUTH_SECRET!, 'admin', Date.now() - 1)
    ),
    false
  );
});
