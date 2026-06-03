import { DEFAULT_SPACER_HEIGHT_MM } from '@/lib/layout-settings';
import type {
  LayoutAnchor,
  LayoutControl,
  ResumeData,
  ResumeLayoutSettings,
  SectionKey,
} from '@/types/resume';
import { DEFAULT_LAYOUT_SETTINGS } from '@/types/resume';

export type BlockColumn = 'header' | 'left' | 'right' | 'full';

export type BlockKind =
  | 'header'
  | 'sectionHeading'
  | 'experienceEntry'
  | 'certificateEntry'
  | 'educationEntry'
  | 'skills'
  | 'about'
  | 'projectEntry'
  | 'spacer'
  | 'pageBreak';

export interface ResumeBlock {
  id: string;
  kind: BlockKind;
  column: BlockColumn;
  section?: SectionKey;
  entryId?: string;
  controlId?: string;
  heightMm?: number;
}

function anchorKey(anchor: LayoutAnchor): string {
  if (anchor.kind === 'afterHeader') {
    return 'afterHeader';
  }
  if (anchor.kind === 'beforeSection' || anchor.kind === 'afterSection') {
    return `${anchor.kind}:${anchor.section}`;
  }
  return `${anchor.kind}:${anchor.section}:${anchor.entryId}`;
}

function controlsAt(controls: LayoutControl[], key: string): LayoutControl[] {
  return controls.filter((control) => anchorKey(control.anchor) === key);
}

function pushControls(
  blocks: ResumeBlock[],
  controls: LayoutControl[],
  column: BlockColumn
) {
  for (const control of controls) {
    if (control.type === 'pageBreak') {
      blocks.push({
        id: `break-${control.id}`,
        kind: 'pageBreak',
        column,
        controlId: control.id,
      });
      continue;
    }
    blocks.push({
      id: `spacer-${control.id}`,
      kind: 'spacer',
      column,
      controlId: control.id,
      heightMm: control.heightMm ?? DEFAULT_SPACER_HEIGHT_MM,
    });
  }
}

export function buildBlockStream(
  data: ResumeData,
  layout: ResumeLayoutSettings = DEFAULT_LAYOUT_SETTINGS
): ResumeBlock[] {
  const controls = layout.controls ?? [];
  const blocks: ResumeBlock[] = [];

  blocks.push({ id: 'header', kind: 'header', column: 'header' });
  pushControls(blocks, controlsAt(controls, 'afterHeader'), 'header');

  if (data.experience.length > 0) {
    pushControls(blocks, controlsAt(controls, 'beforeSection:experience'), 'left');
    blocks.push({
      id: 'heading-experience',
      kind: 'sectionHeading',
      column: 'left',
      section: 'experience',
    });
    data.experience.forEach((entry, index) => {
      pushControls(
        blocks,
        controlsAt(controls, `beforeEntry:experience:${entry.id}`),
        'left'
      );
      blocks.push({
        id: `experience-${entry.id}`,
        kind: 'experienceEntry',
        column: 'left',
        section: 'experience',
        entryId: entry.id,
      });
      pushControls(
        blocks,
        controlsAt(controls, `afterEntry:experience:${entry.id}`),
        'left'
      );
      if (index === data.experience.length - 1) {
        pushControls(blocks, controlsAt(controls, 'afterSection:experience'), 'left');
      }
    });
  }

  if (data.certificates.length > 0) {
    pushControls(blocks, controlsAt(controls, 'beforeSection:certificates'), 'left');
    blocks.push({
      id: 'heading-certificates',
      kind: 'sectionHeading',
      column: 'left',
      section: 'certificates',
    });
    data.certificates.forEach((entry, index) => {
      pushControls(
        blocks,
        controlsAt(controls, `beforeEntry:certificates:${entry.id}`),
        'left'
      );
      blocks.push({
        id: `certificate-${entry.id}`,
        kind: 'certificateEntry',
        column: 'left',
        section: 'certificates',
        entryId: entry.id,
      });
      pushControls(
        blocks,
        controlsAt(controls, `afterEntry:certificates:${entry.id}`),
        'left'
      );
      if (index === data.certificates.length - 1) {
        pushControls(blocks, controlsAt(controls, 'afterSection:certificates'), 'left');
      }
    });
  }

  if (data.education.length > 0) {
    pushControls(blocks, controlsAt(controls, 'beforeSection:education'), 'right');
    blocks.push({
      id: 'heading-education',
      kind: 'sectionHeading',
      column: 'right',
      section: 'education',
    });
    data.education.forEach((entry, index) => {
      pushControls(
        blocks,
        controlsAt(controls, `beforeEntry:education:${entry.id}`),
        'right'
      );
      blocks.push({
        id: `education-${entry.id}`,
        kind: 'educationEntry',
        column: 'right',
        section: 'education',
        entryId: entry.id,
      });
      pushControls(
        blocks,
        controlsAt(controls, `afterEntry:education:${entry.id}`),
        'right'
      );
      if (index === data.education.length - 1) {
        pushControls(blocks, controlsAt(controls, 'afterSection:education'), 'right');
      }
    });
  }

  if (data.skills.length > 0) {
    pushControls(blocks, controlsAt(controls, 'beforeSection:skills'), 'right');
    blocks.push({ id: 'skills', kind: 'skills', column: 'right', section: 'skills' });
    pushControls(blocks, controlsAt(controls, 'afterSection:skills'), 'right');
  }

  if (data.about.trim()) {
    pushControls(blocks, controlsAt(controls, 'beforeSection:about'), 'right');
    blocks.push({ id: 'about', kind: 'about', column: 'right', section: 'about' });
    pushControls(blocks, controlsAt(controls, 'afterSection:about'), 'right');
  }

  if (data.projects.length > 0) {
    pushControls(blocks, controlsAt(controls, 'beforeSection:projects'), 'full');
    blocks.push({
      id: 'heading-projects',
      kind: 'sectionHeading',
      column: 'full',
      section: 'projects',
    });
    data.projects.forEach((entry, index) => {
      pushControls(
        blocks,
        controlsAt(controls, `beforeEntry:projects:${entry.id}`),
        'full'
      );
      blocks.push({
        id: `project-${entry.id}`,
        kind: 'projectEntry',
        column: 'full',
        section: 'projects',
        entryId: entry.id,
      });
      pushControls(
        blocks,
        controlsAt(controls, `afterEntry:projects:${entry.id}`),
        'full'
      );
      if (index === data.projects.length - 1) {
        pushControls(blocks, controlsAt(controls, 'afterSection:projects'), 'full');
      }
    });
  }

  return blocks;
}

export function splitBlockStreams(blocks: ResumeBlock[]) {
  const headerBlocks = blocks.filter((block) => block.column === 'header');
  const leftBlocks = blocks.filter((block) => block.column === 'left');
  const rightBlocks = blocks.filter((block) => block.column === 'right');
  const fullBlocks = blocks.filter((block) => block.column === 'full');
  return { headerBlocks, leftBlocks, rightBlocks, fullBlocks };
}

export function continuationQueue(
  leftBlocks: ResumeBlock[],
  rightBlocks: ResumeBlock[],
  fullBlocks: ResumeBlock[]
) {
  return [...leftBlocks, ...rightBlocks, ...fullBlocks];
}
