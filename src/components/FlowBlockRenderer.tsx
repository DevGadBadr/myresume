'use client';

import type { FlowBlock } from '@/lib/flow-blocks';
import type { ResumeData, SectionKey } from '@/types/resume';
import { SECTION_LABELS } from '@/layouts/types';
import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';
import { useEditMode } from '@/context/EditModeContext';

interface FlowBlockRendererProps {
  block: FlowBlock;
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
}

const noop = () => {};

function SectionActions({
  section,
  onChange,
}: {
  section: SectionKey;
  onChange: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const { isEditing } = useEditMode();
  if (!isEditing) return null;

  const buttonClass =
    'mt-2 w-full text-sm text-[#8B0000] border border-dashed border-[#8B0000] rounded py-1.5 hover:bg-red-50 transition-colors no-print';

  switch (section) {
    case 'experience':
      return (
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
    case 'projects':
      return (
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
    case 'education':
      return (
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
    case 'certificates':
      return (
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
    default:
      return null;
  }
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
      return (
        <h2 className="section-heading">
          {block.section ? SECTION_LABELS[block.section] : ''}
        </h2>
      );
    case 'about':
      return (
        <AboutMeSection
          text={data.about}
          onChange={(about) => update((current) => ({ ...current, about }))}
          showHeading={false}
        />
      );
    case 'experience': {
      const items = data.experience.filter((item) => item.id === block.entryId);
      if (items.length === 0) return null;
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
        <SectionActions section={block.section} onChange={update} />
      ) : null;
    default:
      return null;
  }
}
