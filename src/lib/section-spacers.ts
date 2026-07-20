import { isSectionKey, type ResumeData, type SectionKey, type SectionSpacer } from '@/types/resume';

export const MIN_SECTION_SPACER_LINES = 1;
export const MAX_SECTION_SPACER_LINES = 24;
/** Visual height of one spacer "line" (matches body text rhythm). */
export const SECTION_SPACER_LINE_REM = 1.25;

export function clampSpacerLines(lines: number): number {
  if (!Number.isFinite(lines)) return MIN_SECTION_SPACER_LINES;
  return Math.min(
    MAX_SECTION_SPACER_LINES,
    Math.max(MIN_SECTION_SPACER_LINES, Math.round(lines))
  );
}

export function normalizeSectionSpacers(value: unknown): SectionSpacer[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const bySection = new Map<SectionKey, number>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (!isSectionKey(record.afterSection)) continue;
    const lines =
      typeof record.lines === 'number'
        ? record.lines
        : typeof record.lines === 'string'
          ? Number(record.lines)
          : NaN;
    if (!Number.isFinite(lines) || lines <= 0) continue;
    bySection.set(record.afterSection, clampSpacerLines(lines));
  }

  if (bySection.size === 0) return undefined;

  return Array.from(bySection.entries()).map(([afterSection, lines]) => ({
    afterSection,
    lines,
  }));
}

export function getSpacerLinesAfter(
  spacers: SectionSpacer[] | undefined,
  section: SectionKey
): number {
  return spacers?.find((item) => item.afterSection === section)?.lines ?? 0;
}

export function upsertSectionSpacer(
  spacers: SectionSpacer[] | undefined,
  afterSection: SectionKey,
  lines: number
): SectionSpacer[] {
  const nextLines = clampSpacerLines(lines);
  const current = spacers ?? [];
  const without = current.filter((item) => item.afterSection !== afterSection);
  return [...without, { afterSection, lines: nextLines }];
}

export function removeSectionSpacer(
  spacers: SectionSpacer[] | undefined,
  afterSection: SectionKey
): SectionSpacer[] | undefined {
  const next = (spacers ?? []).filter((item) => item.afterSection !== afterSection);
  return next.length > 0 ? next : undefined;
}

export function adjustSectionSpacer(
  data: Pick<ResumeData, 'sectionSpacers'>,
  afterSection: SectionKey,
  delta: number
): SectionSpacer[] | undefined {
  const current = getSpacerLinesAfter(data.sectionSpacers, afterSection);
  if (current <= 0) {
    if (delta <= 0) return data.sectionSpacers;
    return upsertSectionSpacer(data.sectionSpacers, afterSection, MIN_SECTION_SPACER_LINES);
  }
  const next = current + delta;
  if (next < MIN_SECTION_SPACER_LINES) {
    return removeSectionSpacer(data.sectionSpacers, afterSection);
  }
  return upsertSectionSpacer(data.sectionSpacers, afterSection, next);
}
