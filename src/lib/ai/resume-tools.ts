import type {
  ExperienceEntry,
  ProjectEntry,
  ResumeTemplate,
  ResumeTemplateContent,
  SectionKey,
  SkillEntry,
} from '@/types/resume';
import { ALL_SECTION_KEYS, isSectionKey } from '@/types/resume';
import { compactDraftTemplate } from '@/lib/ai/compact-resume';
import type { AiGenerateModelOutput, AiTailorSummary } from '@/lib/ai/types';

export class ResumeToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeToolError';
  }
}

function cloneTemplate(template: ResumeTemplate): ResumeTemplate {
  return {
    ...template,
    sectionOrder: template.sectionOrder ? [...template.sectionOrder] : undefined,
    sectionSpacers: template.sectionSpacers?.map((item) => ({ ...item })),
    content: {
      about: template.content.about,
      experience: template.content.experience.map((entry) => ({
        ...entry,
        bullets: [...entry.bullets],
      })),
      projects: template.content.projects.map((entry) => {
        const cloned: ProjectEntry = {
          ...entry,
          bullets: [...entry.bullets],
          tags: [...entry.tags],
        };
        if (entry.deployment) {
          cloned.deployment = {
            ...entry.deployment,
            credentials: entry.deployment.credentials?.map((credential) => ({ ...credential })),
          };
        }
        return cloned;
      }),
      skills: template.content.skills.map((entry) => ({ ...entry })),
      education: template.content.education.map((entry) => ({ ...entry })),
      certificates: template.content.certificates.map((entry) => ({ ...entry })),
      layout: template.content.layout
        ? {
            controls: template.content.layout.controls.map((control) => ({ ...control })),
            sections: template.content.layout.sections
              ? { ...template.content.layout.sections }
              : undefined,
            pageMargins: template.content.layout.pageMargins
              ? { ...template.content.layout.pageMargins }
              : undefined,
          }
        : undefined,
    },
  };
}

function findExperienceIndex(content: ResumeTemplateContent, entryId: string) {
  const index = content.experience.findIndex((entry) => entry.id === entryId);
  if (index < 0) {
    throw new ResumeToolError(`Experience entry not found: ${entryId}`);
  }
  return index;
}

function findProjectIndex(content: ResumeTemplateContent, entryId: string) {
  const index = content.projects.findIndex((entry) => entry.id === entryId);
  if (index < 0) {
    throw new ResumeToolError(`Project entry not found: ${entryId}`);
  }
  return index;
}

function normalizeSectionOrder(order: unknown): SectionKey[] | undefined {
  if (!Array.isArray(order)) {
    return undefined;
  }
  const filtered = order.filter(isSectionKey);
  if (filtered.length === 0) {
    return undefined;
  }
  const seen = new Set<SectionKey>();
  const unique: SectionKey[] = [];
  for (const key of filtered) {
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(key);
    }
  }
  for (const key of ALL_SECTION_KEYS) {
    if (!seen.has(key)) {
      unique.push(key);
    }
  }
  return unique;
}

export function replaceAbout(template: ResumeTemplate, text: string): ResumeTemplate {
  const next = cloneTemplate(template);
  next.content.about = text.trim();
  return next;
}

export function setTargetTitle(template: ResumeTemplate, title: string): ResumeTemplate {
  const next = cloneTemplate(template);
  const trimmed = title.trim();
  if (trimmed) {
    next.targetTitle = trimmed;
  } else {
    delete next.targetTitle;
  }
  return next;
}

export function setExperienceBullets(
  template: ResumeTemplate,
  entryId: string,
  bullets: string[]
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findExperienceIndex(next.content, entryId);
  next.content.experience[index] = {
    ...next.content.experience[index],
    bullets: bullets.map((bullet) => bullet.trim()).filter(Boolean),
  };
  return next;
}

export function editExperienceBullet(
  template: ResumeTemplate,
  entryId: string,
  bulletIndex: number,
  text: string
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findExperienceIndex(next.content, entryId);
  const entry = next.content.experience[index];
  if (bulletIndex < 0 || bulletIndex >= entry.bullets.length) {
    throw new ResumeToolError(`Bullet index out of range for experience ${entryId}`);
  }
  const bullets = [...entry.bullets];
  bullets[bulletIndex] = text.trim();
  next.content.experience[index] = { ...entry, bullets };
  return next;
}

export function addExperienceBullet(
  template: ResumeTemplate,
  entryId: string,
  text: string,
  index?: number
): ResumeTemplate {
  const next = cloneTemplate(template);
  const entryIndex = findExperienceIndex(next.content, entryId);
  const entry = next.content.experience[entryIndex];
  const bullets = [...entry.bullets];
  const insertAt =
    typeof index === 'number' && index >= 0 && index <= bullets.length ? index : bullets.length;
  bullets.splice(insertAt, 0, text.trim());
  next.content.experience[entryIndex] = { ...entry, bullets: bullets.filter(Boolean) };
  return next;
}

export function removeExperienceBullet(
  template: ResumeTemplate,
  entryId: string,
  bulletIndex: number
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findExperienceIndex(next.content, entryId);
  const entry = next.content.experience[index];
  if (bulletIndex < 0 || bulletIndex >= entry.bullets.length) {
    throw new ResumeToolError(`Bullet index out of range for experience ${entryId}`);
  }
  next.content.experience[index] = {
    ...entry,
    bullets: entry.bullets.filter((_, i) => i !== bulletIndex),
  };
  return next;
}

export function reorderOrFilterExperience(
  template: ResumeTemplate,
  entryIds: string[]
): ResumeTemplate {
  const next = cloneTemplate(template);
  const byId = new Map(next.content.experience.map((entry) => [entry.id, entry]));
  const ordered: ExperienceEntry[] = [];
  for (const id of entryIds) {
    const entry = byId.get(id);
    if (entry) {
      ordered.push(entry);
      byId.delete(id);
    }
  }
  next.content.experience = ordered;
  return next;
}

export function setProjectBullets(
  template: ResumeTemplate,
  entryId: string,
  bullets: string[]
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findProjectIndex(next.content, entryId);
  next.content.projects[index] = {
    ...next.content.projects[index],
    bullets: bullets.map((bullet) => bullet.trim()).filter(Boolean),
  };
  return next;
}

export function editProjectBullet(
  template: ResumeTemplate,
  entryId: string,
  bulletIndex: number,
  text: string
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findProjectIndex(next.content, entryId);
  const entry = next.content.projects[index];
  if (bulletIndex < 0 || bulletIndex >= entry.bullets.length) {
    throw new ResumeToolError(`Bullet index out of range for project ${entryId}`);
  }
  const bullets = [...entry.bullets];
  bullets[bulletIndex] = text.trim();
  next.content.projects[index] = { ...entry, bullets };
  return next;
}

export function addProjectBullet(
  template: ResumeTemplate,
  entryId: string,
  text: string,
  index?: number
): ResumeTemplate {
  const next = cloneTemplate(template);
  const entryIndex = findProjectIndex(next.content, entryId);
  const entry = next.content.projects[entryIndex];
  const bullets = [...entry.bullets];
  const insertAt =
    typeof index === 'number' && index >= 0 && index <= bullets.length ? index : bullets.length;
  bullets.splice(insertAt, 0, text.trim());
  next.content.projects[entryIndex] = { ...entry, bullets: bullets.filter(Boolean) };
  return next;
}

export function removeProjectBullet(
  template: ResumeTemplate,
  entryId: string,
  bulletIndex: number
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findProjectIndex(next.content, entryId);
  const entry = next.content.projects[index];
  if (bulletIndex < 0 || bulletIndex >= entry.bullets.length) {
    throw new ResumeToolError(`Bullet index out of range for project ${entryId}`);
  }
  next.content.projects[index] = {
    ...entry,
    bullets: entry.bullets.filter((_, i) => i !== bulletIndex),
  };
  return next;
}

export function setProjectTags(
  template: ResumeTemplate,
  entryId: string,
  tags: string[]
): ResumeTemplate {
  const next = cloneTemplate(template);
  const index = findProjectIndex(next.content, entryId);
  next.content.projects[index] = {
    ...next.content.projects[index],
    tags: tags.map((tag) => tag.trim()).filter(Boolean),
  };
  return next;
}

export function reorderOrFilterProjects(
  template: ResumeTemplate,
  entryIds: string[]
): ResumeTemplate {
  const next = cloneTemplate(template);
  const byId = new Map(next.content.projects.map((entry) => [entry.id, entry]));
  const ordered: ProjectEntry[] = [];
  for (const id of entryIds) {
    const entry = byId.get(id);
    if (entry) {
      ordered.push(entry);
      byId.delete(id);
    }
  }
  next.content.projects = ordered;
  return next;
}

export function setSkills(
  template: ResumeTemplate,
  skills: Array<{ id?: string; label: string; category?: string }>
): ResumeTemplate {
  const next = cloneTemplate(template);
  const usedIds = new Set<string>();
  next.content.skills = skills
    .map((skill) => {
      const label = skill.label.trim();
      if (!label) {
        return null;
      }
      let id = (skill.id?.trim() || `skill-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).trim();
      if (!id || usedIds.has(id)) {
        const suffix =
          typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);
        id = `skill-${suffix}`;
      }
      usedIds.add(id);
      const entry: SkillEntry = { id, label };
      if (skill.category?.trim()) {
        entry.category = skill.category.trim();
      }
      return entry;
    })
    .filter((entry): entry is SkillEntry => Boolean(entry));
  return next;
}

export function setSectionOrder(template: ResumeTemplate, order: SectionKey[]): ResumeTemplate {
  const next = cloneTemplate(template);
  const normalized = normalizeSectionOrder(order);
  if (normalized) {
    next.sectionOrder = normalized;
  }
  return next;
}

export type ResumeToolName =
  | 'get_draft_snapshot'
  | 'replace_about'
  | 'set_target_title'
  | 'set_experience_bullets'
  | 'edit_experience_bullet'
  | 'add_experience_bullet'
  | 'remove_experience_bullet'
  | 'reorder_or_filter_experience'
  | 'set_project_bullets'
  | 'edit_project_bullet'
  | 'add_project_bullet'
  | 'remove_project_bullet'
  | 'set_project_tags'
  | 'reorder_or_filter_projects'
  | 'set_skills'
  | 'set_section_order';

export const RESUME_TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_draft_snapshot',
      description: 'Return a compact snapshot of the current tailored resume draft.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'replace_about',
      description: 'Replace the About / summary section text.',
      parameters: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_target_title',
      description: 'Set the job-facing title override for this variant.',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' } },
        required: ['title'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_experience_bullets',
      description: 'Replace all bullets for an experience entry.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['entryId', 'bullets'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_experience_bullet',
      description: 'Edit one experience bullet by index.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          bulletIndex: { type: 'integer' },
          text: { type: 'string' },
        },
        required: ['entryId', 'bulletIndex', 'text'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_experience_bullet',
      description: 'Add a bullet to an experience entry.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          text: { type: 'string' },
          index: { type: 'integer' },
        },
        required: ['entryId', 'text'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_experience_bullet',
      description: 'Remove an experience bullet by index.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          bulletIndex: { type: 'integer' },
        },
        required: ['entryId', 'bulletIndex'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reorder_or_filter_experience',
      description: 'Keep and reorder experience entries by id list. Omitted ids are dropped from the variant.',
      parameters: {
        type: 'object',
        properties: {
          entryIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['entryIds'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_project_bullets',
      description: 'Replace all bullets for a project entry.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['entryId', 'bullets'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_project_bullet',
      description: 'Edit one project bullet by index.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          bulletIndex: { type: 'integer' },
          text: { type: 'string' },
        },
        required: ['entryId', 'bulletIndex', 'text'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_project_bullet',
      description: 'Add a bullet to a project entry.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          text: { type: 'string' },
          index: { type: 'integer' },
        },
        required: ['entryId', 'text'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_project_bullet',
      description: 'Remove a project bullet by index.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          bulletIndex: { type: 'integer' },
        },
        required: ['entryId', 'bulletIndex'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_project_tags',
      description: 'Replace tags for a project entry.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['entryId', 'tags'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reorder_or_filter_projects',
      description: 'Keep and reorder projects by id list. Omitted ids are dropped.',
      parameters: {
        type: 'object',
        properties: {
          entryIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['entryIds'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_skills',
      description: 'Replace the full skills list for this variant.',
      parameters: {
        type: 'object',
        properties: {
          skills: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                category: { type: 'string' },
              },
              required: ['label'],
              additionalProperties: false,
            },
          },
        },
        required: ['skills'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_section_order',
      description: 'Set main section order for this variant.',
      parameters: {
        type: 'object',
        properties: {
          order: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['about', 'experience', 'projects', 'skills', 'education', 'certificates'],
            },
          },
        },
        required: ['order'],
        additionalProperties: false,
      },
    },
  },
];

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new ResumeToolError(`${field} must be an array of strings`);
  }
  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new ResumeToolError(`${field}[${index}] must be a string`);
    }
    return item;
  });
}

export function applyResumeTool(
  template: ResumeTemplate,
  name: string,
  rawArgs: unknown
): { template: ResumeTemplate; result: unknown } {
  const args =
    rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs)
      ? (rawArgs as Record<string, unknown>)
      : {};

  switch (name as ResumeToolName) {
    case 'get_draft_snapshot':
      return { template, result: compactDraftTemplate(template) };
    case 'replace_about': {
      if (typeof args.text !== 'string') {
        throw new ResumeToolError('replace_about requires text');
      }
      const next = replaceAbout(template, args.text);
      return { template: next, result: { ok: true } };
    }
    case 'set_target_title': {
      if (typeof args.title !== 'string') {
        throw new ResumeToolError('set_target_title requires title');
      }
      return { template: setTargetTitle(template, args.title), result: { ok: true } };
    }
    case 'set_experience_bullets': {
      if (typeof args.entryId !== 'string') {
        throw new ResumeToolError('set_experience_bullets requires entryId');
      }
      return {
        template: setExperienceBullets(template, args.entryId, asStringArray(args.bullets, 'bullets')),
        result: { ok: true },
      };
    }
    case 'edit_experience_bullet': {
      if (typeof args.entryId !== 'string' || typeof args.text !== 'string') {
        throw new ResumeToolError('edit_experience_bullet requires entryId and text');
      }
      if (typeof args.bulletIndex !== 'number') {
        throw new ResumeToolError('edit_experience_bullet requires bulletIndex');
      }
      return {
        template: editExperienceBullet(template, args.entryId, args.bulletIndex, args.text),
        result: { ok: true },
      };
    }
    case 'add_experience_bullet': {
      if (typeof args.entryId !== 'string' || typeof args.text !== 'string') {
        throw new ResumeToolError('add_experience_bullet requires entryId and text');
      }
      return {
        template: addExperienceBullet(
          template,
          args.entryId,
          args.text,
          typeof args.index === 'number' ? args.index : undefined
        ),
        result: { ok: true },
      };
    }
    case 'remove_experience_bullet': {
      if (typeof args.entryId !== 'string' || typeof args.bulletIndex !== 'number') {
        throw new ResumeToolError('remove_experience_bullet requires entryId and bulletIndex');
      }
      return {
        template: removeExperienceBullet(template, args.entryId, args.bulletIndex),
        result: { ok: true },
      };
    }
    case 'reorder_or_filter_experience':
      return {
        template: reorderOrFilterExperience(template, asStringArray(args.entryIds, 'entryIds')),
        result: { ok: true },
      };
    case 'set_project_bullets': {
      if (typeof args.entryId !== 'string') {
        throw new ResumeToolError('set_project_bullets requires entryId');
      }
      return {
        template: setProjectBullets(template, args.entryId, asStringArray(args.bullets, 'bullets')),
        result: { ok: true },
      };
    }
    case 'edit_project_bullet': {
      if (typeof args.entryId !== 'string' || typeof args.text !== 'string') {
        throw new ResumeToolError('edit_project_bullet requires entryId and text');
      }
      if (typeof args.bulletIndex !== 'number') {
        throw new ResumeToolError('edit_project_bullet requires bulletIndex');
      }
      return {
        template: editProjectBullet(template, args.entryId, args.bulletIndex, args.text),
        result: { ok: true },
      };
    }
    case 'add_project_bullet': {
      if (typeof args.entryId !== 'string' || typeof args.text !== 'string') {
        throw new ResumeToolError('add_project_bullet requires entryId and text');
      }
      return {
        template: addProjectBullet(
          template,
          args.entryId,
          args.text,
          typeof args.index === 'number' ? args.index : undefined
        ),
        result: { ok: true },
      };
    }
    case 'remove_project_bullet': {
      if (typeof args.entryId !== 'string' || typeof args.bulletIndex !== 'number') {
        throw new ResumeToolError('remove_project_bullet requires entryId and bulletIndex');
      }
      return {
        template: removeProjectBullet(template, args.entryId, args.bulletIndex),
        result: { ok: true },
      };
    }
    case 'set_project_tags': {
      if (typeof args.entryId !== 'string') {
        throw new ResumeToolError('set_project_tags requires entryId');
      }
      return {
        template: setProjectTags(template, args.entryId, asStringArray(args.tags, 'tags')),
        result: { ok: true },
      };
    }
    case 'reorder_or_filter_projects':
      return {
        template: reorderOrFilterProjects(template, asStringArray(args.entryIds, 'entryIds')),
        result: { ok: true },
      };
    case 'set_skills': {
      if (!Array.isArray(args.skills)) {
        throw new ResumeToolError('set_skills requires skills array');
      }
      const skills = args.skills.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new ResumeToolError(`skills[${index}] must be an object`);
        }
        const record = item as Record<string, unknown>;
        if (typeof record.label !== 'string') {
          throw new ResumeToolError(`skills[${index}].label must be a string`);
        }
        return {
          id: typeof record.id === 'string' ? record.id : undefined,
          label: record.label,
          category: typeof record.category === 'string' ? record.category : undefined,
        };
      });
      return { template: setSkills(template, skills), result: { ok: true } };
    }
    case 'set_section_order': {
      const order = normalizeSectionOrder(args.order);
      if (!order) {
        throw new ResumeToolError('set_section_order requires a valid order array');
      }
      return { template: setSectionOrder(template, order), result: { ok: true } };
    }
    default:
      throw new ResumeToolError(`Unknown tool: ${name}`);
  }
}

function emptySummary(): AiTailorSummary {
  return {
    overview: '',
    contentAdded: [],
    libraryProposals: [],
    gaps: [],
    keywordFocus: [],
  };
}

function readSummary(value: unknown): AiTailorSummary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return emptySummary();
  }
  const record = value as Record<string, unknown>;
  return {
    overview: typeof record.overview === 'string' ? record.overview.trim() : '',
    contentAdded: Array.isArray(record.contentAdded)
      ? record.contentAdded
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            kind: (typeof item.kind === 'string' ? item.kind : 'other') as AiTailorSummary['contentAdded'][number]['kind'],
            where: typeof item.where === 'string' ? item.where : '',
            text: typeof item.text === 'string' ? item.text : '',
            reason: typeof item.reason === 'string' ? item.reason : '',
          }))
          .filter((item) => item.text.trim())
      : [],
    libraryProposals: Array.isArray(record.libraryProposals)
      ? record.libraryProposals
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            kind: (typeof item.kind === 'string' ? item.kind : 'other') as AiTailorSummary['libraryProposals'][number]['kind'],
            suggestedText: typeof item.suggestedText === 'string' ? item.suggestedText : '',
            targetHint: typeof item.targetHint === 'string' ? item.targetHint : '',
            reason: typeof item.reason === 'string' ? item.reason : '',
          }))
          .filter((item) => item.suggestedText.trim())
      : [],
    gaps: Array.isArray(record.gaps)
      ? record.gaps.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [],
    keywordFocus: Array.isArray(record.keywordFocus)
      ? record.keywordFocus.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0
        )
      : [],
  };
}

/** Merge model generate JSON onto a library-cloned draft template. */
export function applyGenerateOutput(
  baseTemplate: ResumeTemplate,
  output: AiGenerateModelOutput
): { template: ResumeTemplate; summary: AiTailorSummary } {
  let next = cloneTemplate(baseTemplate);

  if (output.targetTitle?.trim()) {
    next = setTargetTitle(next, output.targetTitle);
  }

  next = replaceAbout(next, output.about || next.content.about);

  const sectionOrder = normalizeSectionOrder(output.sectionOrder);
  if (sectionOrder) {
    next = setSectionOrder(next, sectionOrder);
  }

  const experienceById = new Map(baseTemplate.content.experience.map((entry) => [entry.id, entry]));
  const tailoredExperience: ExperienceEntry[] = [];
  for (const item of output.experience ?? []) {
    const source = experienceById.get(item.id);
    if (!source) {
      continue;
    }
    tailoredExperience.push({
      ...source,
      role: item.role?.trim() || source.role,
      roleSubtitle: item.roleSubtitle?.trim() || source.roleSubtitle,
      company: item.company?.trim() || source.company,
      period: item.period?.trim() || source.period,
      bullets: (item.bullets ?? []).map((bullet) => bullet.trim()).filter(Boolean),
    });
  }
  next.content.experience = tailoredExperience;

  const projectById = new Map(baseTemplate.content.projects.map((entry) => [entry.id, entry]));
  const tailoredProjects: ProjectEntry[] = [];
  for (const item of output.projects ?? []) {
    const source = projectById.get(item.id);
    if (!source) {
      continue;
    }
    tailoredProjects.push({
      ...source,
      title: item.title?.trim() || source.title,
      description: item.description?.trim() || source.description,
      bullets: (item.bullets ?? []).map((bullet) => bullet.trim()).filter(Boolean),
      tags: item.tags ? item.tags.map((tag) => tag.trim()).filter(Boolean) : [...source.tags],
    });
  }
  next.content.projects = tailoredProjects;

  next = setSkills(next, output.skills ?? []);

  if (Array.isArray(output.education)) {
    const educationById = new Map(baseTemplate.content.education.map((entry) => [entry.id, entry]));
    next.content.education = output.education
      .map((item) => {
        const source = educationById.get(item.id);
        if (!source) {
          return null;
        }
        return {
          ...source,
          degree: item.degree?.trim() || source.degree,
          institution: item.institution?.trim() || source.institution,
          period: item.period?.trim() || source.period,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }

  if (Array.isArray(output.certificates)) {
    const certById = new Map(baseTemplate.content.certificates.map((entry) => [entry.id, entry]));
    next.content.certificates = output.certificates
      .map((item) => {
        const source = certById.get(item.id);
        if (!source) {
          return null;
        }
        return {
          ...source,
          title: item.title?.trim() || source.title,
          issuer: item.issuer?.trim() || source.issuer,
          date: item.date?.trim() || source.date,
          hours: item.hours?.trim() || source.hours,
          link: item.link?.trim() || source.link,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }

  return { template: next, summary: readSummary(output.summary) };
}

export function parseGenerateModelOutput(raw: string): AiGenerateModelOutput {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;
  const parsed = JSON.parse(jsonText) as AiGenerateModelOutput;
  if (!parsed || typeof parsed !== 'object') {
    throw new ResumeToolError('Model output must be a JSON object');
  }
  if (typeof parsed.about !== 'string') {
    throw new ResumeToolError('Model output.about must be a string');
  }
  if (!Array.isArray(parsed.experience) || !Array.isArray(parsed.projects) || !Array.isArray(parsed.skills)) {
    throw new ResumeToolError('Model output must include experience, projects, and skills arrays');
  }
  return parsed;
}

export { readSummary, cloneTemplate };
