import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from '../src/lib/auth-token.ts';
import {
  normalizeResumeData,
  tryNormalizeResumeData,
} from '../src/lib/resume-validation.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';

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
  assert.equal(normalized.templates[1].hideContactInfo, true);
  assert.deepEqual(normalized.projects[0].deployment, {
    url: 'https://demo.example.com/app',
    credentials: [
      { id: 'login-email', label: 'Email', value: 'tester@example.com' },
      { id: 'login-password', label: 'Password', value: 'secret' },
    ],
  });
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
