import type { ResumeLayoutDefinition } from '@/layouts/types';
import {
  ALL_SECTION_KEYS,
  isSectionKey,
  type ResumeData,
  type SectionKey,
} from '@/types/resume';

/** Default section order from a layout definition (unique, stable). */
export function defaultSectionOrder(layout: ResumeLayoutDefinition): SectionKey[] {
  const seen = new Set<SectionKey>();
  const order: SectionKey[] = [];
  for (const item of layout.sections) {
    if (seen.has(item.section)) continue;
    seen.add(item.section);
    order.push(item.section);
  }
  return order;
}

/**
 * Resolve effective section order: custom order when valid, otherwise layout default.
 * Unknown keys are dropped; missing layout sections are appended in default order.
 */
export function resolveSectionOrder(
  customOrder: SectionKey[] | undefined,
  layout: ResumeLayoutDefinition
): SectionKey[] {
  const defaults = defaultSectionOrder(layout);
  if (!customOrder || customOrder.length === 0) {
    return defaults;
  }

  const allowed = new Set(defaults);
  const seen = new Set<SectionKey>();
  const result: SectionKey[] = [];

  for (const key of customOrder) {
    if (!allowed.has(key) || seen.has(key)) continue;
    result.push(key);
    seen.add(key);
  }

  for (const key of defaults) {
    if (!seen.has(key)) result.push(key);
  }

  return result;
}

export function moveSectionInOrder(
  order: SectionKey[],
  section: SectionKey,
  direction: 'up' | 'down'
): SectionKey[] {
  const index = order.indexOf(section);
  if (index < 0) return order;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= order.length) return order;
  const next = [...order];
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  return next;
}

export function readSectionOrder(value: unknown): SectionKey[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<SectionKey>();
  const order: SectionKey[] = [];
  for (const item of value) {
    if (!isSectionKey(item) || seen.has(item)) continue;
    // Only accept known section keys (including ones not in a given layout)
    if (!(ALL_SECTION_KEYS as string[]).includes(item)) continue;
    seen.add(item);
    order.push(item);
  }
  return order.length > 0 ? order : undefined;
}

export function sectionOrderFromData(
  data: Pick<ResumeData, 'sectionOrder'>,
  layout: ResumeLayoutDefinition
): SectionKey[] {
  return resolveSectionOrder(data.sectionOrder, layout);
}
