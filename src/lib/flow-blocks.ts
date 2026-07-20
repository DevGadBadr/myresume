import type { ResumeLayoutDefinition } from '@/layouts/types';
import type { ResumeData, SectionKey } from '@/types/resume';
import { sectionOrderFromData } from '@/lib/section-order';
import { getSpacerLinesAfter } from '@/lib/section-spacers';

export type FlowBlockKind =
  | 'header'
  | 'heading'
  | 'about'
  | 'experience'
  | 'project'
  | 'education'
  | 'certificate'
  | 'skills'
  | 'sectionActions'
  | 'spacer';

export interface FlowBlock {
  id: string;
  kind: FlowBlockKind;
  section?: SectionKey;
  entryId?: string;
  /** Force a new page before this block. */
  pageBreakBefore?: boolean;
  /** Keep this block with the following block (section headings). */
  keepWithNext?: boolean;
  /** Spacer height in blank lines. */
  spacerLines?: number;
}

function headingId(section: SectionKey) {
  return `heading-${section}`;
}

function entryId(section: SectionKey, id: string) {
  return `${section}-${id}`;
}

function actionsId(section: SectionKey) {
  return `actions-${section}`;
}

function appendSectionBlocks(
  blocks: FlowBlock[],
  section: SectionKey,
  data: ResumeData
) {
  switch (section) {
    case 'about':
      blocks.push({ id: headingId('about'), kind: 'heading', section: 'about', keepWithNext: true });
      blocks.push({ id: 'about-body', kind: 'about', section: 'about' });
      blocks.push({
        id: actionsId('about'),
        kind: 'sectionActions',
        section: 'about',
      });
      break;
    case 'experience':
      blocks.push({
        id: headingId('experience'),
        kind: 'heading',
        section: 'experience',
        keepWithNext: true,
      });
      for (const item of data.experience) {
        blocks.push({
          id: entryId('experience', item.id),
          kind: 'experience',
          section: 'experience',
          entryId: item.id,
          pageBreakBefore: item.pageBreakBefore,
        });
      }
      blocks.push({
        id: actionsId('experience'),
        kind: 'sectionActions',
        section: 'experience',
      });
      break;
    case 'projects':
      blocks.push({
        id: headingId('projects'),
        kind: 'heading',
        section: 'projects',
        keepWithNext: true,
      });
      for (const item of data.projects) {
        blocks.push({
          id: entryId('projects', item.id),
          kind: 'project',
          section: 'projects',
          entryId: item.id,
          pageBreakBefore: item.pageBreakBefore,
        });
      }
      blocks.push({
        id: actionsId('projects'),
        kind: 'sectionActions',
        section: 'projects',
      });
      break;
    case 'education':
      blocks.push({
        id: headingId('education'),
        kind: 'heading',
        section: 'education',
        keepWithNext: true,
      });
      for (const item of data.education) {
        blocks.push({
          id: entryId('education', item.id),
          kind: 'education',
          section: 'education',
          entryId: item.id,
          pageBreakBefore: item.pageBreakBefore,
        });
      }
      blocks.push({
        id: actionsId('education'),
        kind: 'sectionActions',
        section: 'education',
      });
      break;
    case 'certificates':
      blocks.push({
        id: headingId('certificates'),
        kind: 'heading',
        section: 'certificates',
        keepWithNext: true,
      });
      for (const item of data.certificates) {
        blocks.push({
          id: entryId('certificates', item.id),
          kind: 'certificate',
          section: 'certificates',
          entryId: item.id,
          pageBreakBefore: item.pageBreakBefore,
        });
      }
      blocks.push({
        id: actionsId('certificates'),
        kind: 'sectionActions',
        section: 'certificates',
      });
      break;
    case 'skills':
      blocks.push({
        id: headingId('skills'),
        kind: 'heading',
        section: 'skills',
        keepWithNext: true,
      });
      blocks.push({ id: 'skills-body', kind: 'skills', section: 'skills' });
      blocks.push({
        id: actionsId('skills'),
        kind: 'sectionActions',
        section: 'skills',
      });
      break;
    default:
      break;
  }
}

/** Build a flat stream of atomic layout blocks using the resume's section order. */
export function buildFlowBlocks(
  data: ResumeData,
  layout: ResumeLayoutDefinition
): FlowBlock[] {
  const blocks: FlowBlock[] = [{ id: 'header', kind: 'header' }];
  const orderedSections = sectionOrderFromData(data, layout);

  for (const section of orderedSections) {
    appendSectionBlocks(blocks, section, data);
    const spacerLines = getSpacerLinesAfter(data.sectionSpacers, section);
    if (spacerLines > 0) {
      blocks.push({
        id: `spacer-after-${section}`,
        kind: 'spacer',
        section,
        spacerLines,
      });
    }
  }

  return blocks;
}
