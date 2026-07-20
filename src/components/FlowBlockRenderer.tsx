'use client';

import type { FlowBlock } from '@/lib/flow-blocks';
import type { ResumeData, SectionKey } from '@/types/resume';
import { SECTION_LABELS } from '@/layouts/types';
import { getLayoutDefinition, normalizeLayoutId } from '@/layouts';
import {
  moveSectionInOrder,
  sectionOrderFromData,
} from '@/lib/section-order';
import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';
import {
  adjustSectionSpacer,
  getSpacerLinesAfter,
  MAX_SECTION_SPACER_LINES,
  MIN_SECTION_SPACER_LINES,
  removeSectionSpacer,
  SECTION_SPACER_LINE_REM,
  upsertSectionSpacer,
} from '@/lib/section-spacers';
import { useEditMode } from '@/context/EditModeContext';

interface FlowBlockRendererProps {
  block: FlowBlock;
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
}

const noop = () => {};

function SectionSpacerBlock({
  section,
  lines,
  onChange,
}: {
  section: SectionKey;
  lines: number;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const { isEditing } = useEditMode();
  const height = `${Math.max(lines, 1) * SECTION_SPACER_LINE_REM}rem`;

  if (!isEditing) {
    return <div className="resume-section-spacer" style={{ height }} aria-hidden />;
  }

  return (
    <div
      className="resume-section-spacer resume-section-spacer-edit no-print relative"
      style={{ minHeight: height, height }}
    >
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">
          Space · {lines} line{lines === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          disabled={!onChange || lines <= MIN_SECTION_SPACER_LINES}
          onClick={() =>
            onChange?.((current) => ({
              ...current,
              sectionSpacers: adjustSectionSpacer(current, section, -1),
            }))
          }
          className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          title="Remove one line"
        >
          − Line
        </button>
        <button
          type="button"
          disabled={!onChange || lines >= MAX_SECTION_SPACER_LINES}
          onClick={() =>
            onChange?.((current) => ({
              ...current,
              sectionSpacers: adjustSectionSpacer(current, section, 1),
            }))
          }
          className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          title="Add one line"
        >
          + Line
        </button>
        <button
          type="button"
          disabled={!onChange}
          onClick={() =>
            onChange?.((current) => ({
              ...current,
              sectionSpacers: removeSectionSpacer(current.sectionSpacers, section),
            }))
          }
          className="rounded border border-red-200 px-2 py-0.5 text-[11px] text-red-500 hover:bg-red-50 disabled:opacity-40"
          title="Remove spacer"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function SectionHeadingControls({
  section,
  data,
  onChange,
}: {
  section: SectionKey;
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const { isEditing } = useEditMode();
  const layout = getLayoutDefinition(normalizeLayoutId(data.layoutId));
  const order = sectionOrderFromData(data, layout);
  const index = order.indexOf(section);

  if (!isEditing || index < 0) {
    return <h2 className="section-heading">{SECTION_LABELS[section]}</h2>;
  }

  const move = (direction: 'up' | 'down') => {
    if (!onChange) return;
    onChange((current) => {
      const currentLayout = getLayoutDefinition(normalizeLayoutId(current.layoutId));
      const currentOrder = sectionOrderFromData(current, currentLayout);
      return {
        ...current,
        sectionOrder: moveSectionInOrder(currentOrder, section, direction),
      };
    });
  };

  return (
    <div className="resume-section-heading-row">
      <h2 className="section-heading flex-1">{SECTION_LABELS[section]}</h2>
      <div className="no-print mb-1.5 flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => move('up')}
          disabled={index <= 0}
          className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Move ${SECTION_LABELS[section]} section up`}
          title="Move section up"
        >
          Up
        </button>
        <button
          type="button"
          onClick={() => move('down')}
          disabled={index >= order.length - 1}
          className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Move ${SECTION_LABELS[section]} section down`}
          title="Move section down"
        >
          Down
        </button>
      </div>
    </div>
  );
}

function SectionActions({
  section,
  data,
  onChange,
}: {
  section: SectionKey;
  data: ResumeData;
  onChange: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const { isEditing } = useEditMode();
  if (!isEditing) return null;

  const buttonClass =
    'mt-2 w-full text-sm text-[#8B0000] border border-dashed border-[#8B0000] rounded py-1.5 hover:bg-red-50 transition-colors no-print';
  const hasSpacer = getSpacerLinesAfter(data.sectionSpacers, section) > 0;

  let addEntryButton: React.ReactNode = null;
  switch (section) {
    case 'experience':
      addEntryButton = (
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onChange((current) => ({
              ...current,
              experience: [
                ...current.experience,
                {
                  id: crypto.randomUUID(),
                  role: 'New Role',
                  roleSubtitle: 'Role Description',
                  company: 'Company Name',
                  period: 'MM/YYYY – Ongoing',
                  bullets: ['Describe your work here'],
                },
              ],
            }))
          }
        >
          + Add Experience
        </button>
      );
      break;
    case 'projects':
      addEntryButton = (
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onChange((current) => ({
              ...current,
              projects: [
                ...current.projects,
                {
                  id: crypto.randomUUID(),
                  title: 'Project Title',
                  description: 'Tech stack / brief description',
                  bullets: ['Key feature or achievement'],
                  tags: ['React', 'Node.js'],
                },
              ],
            }))
          }
        >
          + Add Project
        </button>
      );
      break;
    case 'education':
      addEntryButton = (
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onChange((current) => ({
              ...current,
              education: [
                ...current.education,
                {
                  id: crypto.randomUUID(),
                  degree: 'Degree / Qualification',
                  institution: 'Institution Name',
                  period: 'YYYY – YYYY',
                },
              ],
            }))
          }
        >
          + Add Education
        </button>
      );
      break;
    case 'certificates':
      addEntryButton = (
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onChange((current) => ({
              ...current,
              certificates: [
                ...current.certificates,
                {
                  id: crypto.randomUUID(),
                  title: 'Certificate Title',
                  issuer: 'Issuer / Platform',
                  date: 'Month YYYY',
                },
              ],
            }))
          }
        >
          + Add Certificate
        </button>
      );
      break;
    default:
      break;
  }

  return (
    <div className="no-print space-y-1.5">
      {addEntryButton}
      {!hasSpacer && (
        <button
          type="button"
          className="w-full rounded border border-dashed border-gray-300 py-1 text-[11px] text-gray-500 transition-colors hover:bg-gray-50"
          onClick={() =>
            onChange((current) => ({
              ...current,
              sectionSpacers: upsertSectionSpacer(
                current.sectionSpacers,
                section,
                MIN_SECTION_SPACER_LINES
              ),
            }))
          }
        >
          + Add space below section
        </button>
      )}
    </div>
  );
}

export default function FlowBlockRenderer({
  block,
  data,
  onChange,
  hideContactInfo = false,
}: FlowBlockRendererProps) {
  const update = onChange ?? noop;

  switch (block.kind) {
    case 'header':
      return (
        <Header
          data={data.personalInfo}
          onChange={(personalInfo) => update((current) => ({ ...current, personalInfo }))}
          hideContactInfo={hideContactInfo}
        />
      );
    case 'heading':
      return block.section ? (
        <SectionHeadingControls section={block.section} data={data} onChange={onChange} />
      ) : null;
    case 'about':
      return (
        <AboutMeSection
          text={data.about}
          onChange={(about) => update((current) => ({ ...current, about }))}
          showHeading={false}
        />
      );
    case 'experience': {
      if (!data.experience.some((item) => item.id === block.entryId)) return null;
      return (
        <ExperienceSection
          items={data.experience}
          onChange={(experience) => update((current) => ({ ...current, experience }))}
          onlyEntryIds={[block.entryId!]}
          showHeading={false}
          showListActions
        />
      );
    }
    case 'project': {
      if (!data.projects.some((item) => item.id === block.entryId)) return null;
      return (
        <ProjectsSection
          items={data.projects}
          onChange={(projects) => update((current) => ({ ...current, projects }))}
          onlyEntryIds={[block.entryId!]}
          showHeading={false}
          showListActions
        />
      );
    }
    case 'education': {
      if (!data.education.some((item) => item.id === block.entryId)) return null;
      return (
        <EducationSection
          items={data.education}
          onChange={(education) => update((current) => ({ ...current, education }))}
          onlyEntryIds={[block.entryId!]}
          showHeading={false}
          showListActions
        />
      );
    }
    case 'certificate': {
      if (!data.certificates.some((item) => item.id === block.entryId)) return null;
      return (
        <CertificatesSection
          items={data.certificates}
          onChange={(certificates) => update((current) => ({ ...current, certificates }))}
          onlyEntryIds={[block.entryId!]}
          showHeading={false}
          showListActions
        />
      );
    }
    case 'skills':
      return (
        <SkillsSection
          skills={data.skills}
          onChange={(skills) => update((current) => ({ ...current, skills }))}
          showHeading={false}
        />
      );
    case 'sectionActions':
      return block.section ? (
        <SectionActions section={block.section} data={data} onChange={update} />
      ) : null;
    case 'spacer':
      return block.section && block.spacerLines ? (
        <SectionSpacerBlock
          section={block.section}
          lines={block.spacerLines}
          onChange={onChange}
        />
      ) : null;
    default:
      return null;
  }
}
