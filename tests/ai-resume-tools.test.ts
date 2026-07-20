import test from 'node:test';
import assert from 'node:assert/strict';
import { compactLibrary, compactDraftTemplate } from '../src/lib/ai/compact-resume.ts';
import {
  applyGenerateOutput,
  applyResumeTool,
  replaceAbout,
  setExperienceBullets,
  reorderOrFilterExperience,
} from '../src/lib/ai/resume-tools.ts';
import {
  buildVariantDisplayName,
  ensureUniqueVariantName,
  withUniqueSavedName,
} from '../src/lib/ai/variant-naming.ts';
import { createDraftTemplateFromLibrary } from '../src/lib/ai/draft-factory.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';

test('compactLibrary strips deployment credentials and page-break chrome', () => {
  const compact = compactLibrary(DEFAULT_RESUME_DATA);
  assert.equal(compact.title, DEFAULT_RESUME_DATA.personalInfo.title);
  assert.ok(!('email' in compact));
  const clinic = compact.projects.find((project) => project.id === '2');
  assert.ok(clinic);
  assert.ok(!('deployment' in clinic));
  assert.ok(compact.experience.every((entry) => !('pageBreakBefore' in entry)));
});

test('compactDraftTemplate mirrors tailored content', () => {
  const draft = createDraftTemplateFromLibrary(DEFAULT_RESUME_DATA, 'Backend Engineer', 'Acme');
  draft.content.about = 'Tailored about';
  const compact = compactDraftTemplate(draft);
  assert.equal(compact.name, 'Acme – Backend Engineer');
  assert.equal(compact.about, 'Tailored about');
  assert.equal(compact.targetTitle, 'Backend Engineer');
});

test('variant naming builds unique display names', () => {
  assert.equal(buildVariantDisplayName('Backend', 'Acme'), 'Acme – Backend');
  assert.equal(ensureUniqueVariantName('Acme – Backend', ['Acme – Backend']), 'Acme – Backend (2)');
  assert.equal(
    ensureUniqueVariantName('Acme – Backend', ['Acme – Backend', 'Acme – Backend (2)']),
    'Acme – Backend (3)'
  );
});

test('withUniqueSavedName renames colliding drafts', () => {
  const draft = createDraftTemplateFromLibrary(DEFAULT_RESUME_DATA, 'Backend', 'Acme');
  const existing = [{ ...draft, id: 'other', name: 'Acme – Backend' }];
  const unique = withUniqueSavedName(draft, existing);
  assert.equal(unique.name, 'Acme – Backend (2)');
});

test('resume tools edit about and experience bullets', () => {
  let draft = createDraftTemplateFromLibrary(DEFAULT_RESUME_DATA, 'Engineer');
  draft = replaceAbout(draft, 'New about text');
  assert.equal(draft.content.about, 'New about text');

  draft = setExperienceBullets(draft, '1', ['Bullet A', 'Bullet B']);
  assert.deepEqual(draft.content.experience.find((entry) => entry.id === '1')?.bullets, [
    'Bullet A',
    'Bullet B',
  ]);

  draft = reorderOrFilterExperience(draft, ['2']);
  assert.deepEqual(
    draft.content.experience.map((entry) => entry.id),
    ['2']
  );
});

test('applyResumeTool set_skills replaces skill list', () => {
  const draft = createDraftTemplateFromLibrary(DEFAULT_RESUME_DATA, 'Engineer');
  const { template } = applyResumeTool(draft, 'set_skills', {
    skills: [
      { id: 's1', label: 'TypeScript' },
      { label: 'Collaboration', category: 'soft' },
    ],
  });
  assert.equal(template.content.skills.length, 2);
  assert.equal(template.content.skills[0].label, 'TypeScript');
  assert.equal(template.content.skills[1].label, 'Collaboration');
});

test('applyGenerateOutput keeps library ids and flags summary', () => {
  const base = createDraftTemplateFromLibrary(DEFAULT_RESUME_DATA, 'Backend', 'Acme');
  const { template, summary } = applyGenerateOutput(base, {
    targetTitle: 'Backend Engineer',
    about: 'Focused backend engineer.',
    experience: [
      {
        id: '1',
        bullets: ['Built NestJS APIs for clinic automation.'],
      },
    ],
    projects: [
      {
        id: '2',
        bullets: ['Automated clinic workflows.'],
        tags: ['NestJS', 'React'],
      },
    ],
    skills: [
      { id: 'skill-nestjs', label: 'NestJS' },
      { label: 'Ownership', category: 'soft' },
    ],
    education: DEFAULT_RESUME_DATA.education.map((entry) => ({ id: entry.id })),
    certificates: [],
    summary: {
      overview: 'Emphasized NestJS backend work.',
      contentAdded: [
        {
          kind: 'soft_skill',
          where: 'skills',
          text: 'Ownership',
          reason: 'Mentioned in JD',
        },
      ],
      libraryProposals: [
        {
          kind: 'bullet',
          suggestedText: 'Add Redis caching bullet to Upwork role',
          targetHint: 'experience:Upwork',
          reason: 'JD asks for caching',
        },
      ],
      gaps: ['Kubernetes production experience'],
      keywordFocus: ['NestJS', 'APIs'],
    },
  });

  assert.equal(template.targetTitle, 'Backend Engineer');
  assert.equal(template.content.about, 'Focused backend engineer.');
  assert.equal(template.content.experience.length, 1);
  assert.equal(template.content.experience[0].id, '1');
  assert.equal(template.content.certificates.length, 0);
  assert.equal(summary.contentAdded[0].text, 'Ownership');
  assert.equal(summary.gaps[0], 'Kubernetes production experience');
});

test('setSkills via applyGenerateOutput adds soft skills', () => {
  const base = createDraftTemplateFromLibrary(DEFAULT_RESUME_DATA, 'Engineer');
  const { template } = applyGenerateOutput(base, {
    about: base.content.about,
    experience: base.content.experience.map((entry) => ({
      id: entry.id,
      bullets: entry.bullets,
    })),
    projects: base.content.projects.map((entry) => ({
      id: entry.id,
      bullets: entry.bullets,
      tags: entry.tags,
    })),
    skills: [{ label: 'Teamwork' }],
    summary: {
      overview: '',
      contentAdded: [],
      libraryProposals: [],
      gaps: [],
      keywordFocus: [],
    },
  });
  assert.equal(template.content.skills.some((skill) => skill.label === 'Teamwork'), true);
});
