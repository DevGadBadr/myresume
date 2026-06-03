import type {
  LayoutAnchor,
  LayoutControl,
  PageMarginsMm,
  ResumeLayoutSettings,
  SectionKey,
  SectionLayoutStyle,
} from '@/types/resume';
import { DEFAULT_LAYOUT_SETTINGS } from '@/types/resume';
import { clampMarginMm } from '@/lib/page-layout';

const SECTION_KEYS: SectionKey[] = [
  'experience',
  'projects',
  'skills',
  'education',
  'certificates',
  'about',
];

function isSectionKey(value: string): value is SectionKey {
  return SECTION_KEYS.includes(value as SectionKey);
}

function readLayoutAnchor(value: unknown, path: string): LayoutAnchor {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const kind = record.kind;
  if (kind === 'afterHeader') {
    return { kind: 'afterHeader' };
  }
  if (kind === 'beforeSection' || kind === 'afterSection') {
    const section = record.section;
    if (typeof section !== 'string' || !isSectionKey(section)) {
      throw new Error(`${path}.section must be a valid section key`);
    }
    return { kind, section };
  }
  if (kind === 'beforeEntry' || kind === 'afterEntry') {
    const section = record.section;
    const entryId = record.entryId;
    if (typeof section !== 'string' || !isSectionKey(section)) {
      throw new Error(`${path}.section must be a valid section key`);
    }
    if (typeof entryId !== 'string' || !entryId.trim()) {
      throw new Error(`${path}.entryId must be a non-empty string`);
    }
    return { kind, section, entryId: entryId.trim() };
  }
  throw new Error(`${path}.kind is invalid`);
}

function readLayoutControl(value: unknown, path: string): LayoutControl {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!id) {
    throw new Error(`${path}.id must be a non-empty string`);
  }
  const type = record.type;
  if (type !== 'spacer' && type !== 'pageBreak') {
    throw new Error(`${path}.type must be spacer or pageBreak`);
  }
  const anchor = readLayoutAnchor(record.anchor, `${path}.anchor`);
  const control: LayoutControl = { id, type, anchor };
  if (type === 'spacer' && record.heightMm !== undefined) {
    const heightMm = Number(record.heightMm);
    if (!Number.isFinite(heightMm) || heightMm < 0) {
      throw new Error(`${path}.heightMm must be a non-negative number`);
    }
    control.heightMm = heightMm;
  }
  return control;
}

function readSectionLayoutStyle(value: unknown, path: string): SectionLayoutStyle {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const style: SectionLayoutStyle = {};
  if (record.minHeightMm !== undefined) {
    const minHeightMm = Number(record.minHeightMm);
    if (!Number.isFinite(minHeightMm) || minHeightMm < 0) {
      throw new Error(`${path}.minHeightMm must be a non-negative number`);
    }
    style.minHeightMm = minHeightMm;
  }
  if (record.paddingBottomMm !== undefined) {
    const paddingBottomMm = Number(record.paddingBottomMm);
    if (!Number.isFinite(paddingBottomMm) || paddingBottomMm < 0) {
      throw new Error(`${path}.paddingBottomMm must be a non-negative number`);
    }
    style.paddingBottomMm = paddingBottomMm;
  }
  return style;
}

function readPageMargins(value: unknown): Partial<PageMarginsMm> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const margins: Partial<PageMarginsMm> = {};
  const sides: (keyof PageMarginsMm)[] = ['top', 'right', 'bottom', 'left'];
  for (const side of sides) {
    if (record[side] === undefined) {
      continue;
    }
    const mm = Number(record[side]);
    if (!Number.isFinite(mm)) {
      continue;
    }
    margins[side] = clampMarginMm(mm);
  }
  return Object.keys(margins).length > 0 ? margins : undefined;
}

export function normalizeLayoutSettings(value: unknown): ResumeLayoutSettings {
  if (value === undefined || value === null) {
    return { ...DEFAULT_LAYOUT_SETTINGS, controls: [], sections: {} };
  }
  if (typeof value !== 'object') {
    return { ...DEFAULT_LAYOUT_SETTINGS, controls: [], sections: {} };
  }
  const record = value as Record<string, unknown>;
  const controls = Array.isArray(record.controls)
    ? record.controls.map((item, index) => {
        try {
          return readLayoutControl(item, `layout.controls[${index}]`);
        } catch {
          return null;
        }
      }).filter((item): item is LayoutControl => item !== null)
    : [];

  const sections: Partial<Record<SectionKey, SectionLayoutStyle>> = {};
  if (record.sections && typeof record.sections === 'object') {
    Object.entries(record.sections as Record<string, unknown>).forEach(([key, sectionValue]) => {
      if (!isSectionKey(key)) {
        return;
      }
      try {
        sections[key] = readSectionLayoutStyle(sectionValue, `layout.sections.${key}`);
      } catch {
        // skip invalid section styles
      }
    });
  }

  const pageMargins = readPageMargins(record.pageMargins);
  const result: ResumeLayoutSettings = { controls, sections };
  if (pageMargins) {
    result.pageMargins = pageMargins;
  }
  return result;
}

export function cloneLayoutSettings(layout?: ResumeLayoutSettings): ResumeLayoutSettings {
  const normalized = normalizeLayoutSettings(layout);
  return {
    controls: normalized.controls.map((control) => ({ ...control, anchor: { ...control.anchor } })),
    sections: Object.fromEntries(
      Object.entries(normalized.sections ?? {}).map(([key, style]) => [
        key,
        { ...style },
      ])
    ) as Partial<Record<SectionKey, SectionLayoutStyle>>,
    pageMargins: normalized.pageMargins ? { ...normalized.pageMargins } : undefined,
  };
}

export const DEFAULT_SPACER_HEIGHT_MM = 8;
