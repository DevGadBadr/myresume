'use client';

import type { ResumeData, SectionKey } from '@/types/resume';
import type { ResumeLayoutDefinition } from '@/layouts/types';
import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';

interface ResumeDocumentBodyProps {
  data: ResumeData;
  layout: ResumeLayoutDefinition;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
}

const noop = () => {};

function SectionBlock({
  section,
  data,
  onChange,
}: {
  section: SectionKey;
  data: ResumeData;
  onChange: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  switch (section) {
    case 'about':
      return (
        <AboutMeSection
          text={data.about}
          onChange={(about) => onChange((current) => ({ ...current, about }))}
        />
      );
    case 'experience':
      return (
        <ExperienceSection
          items={data.experience}
          onChange={(experience) => onChange((current) => ({ ...current, experience }))}
          showListActions
        />
      );
    case 'projects':
      return (
        <ProjectsSection
          items={data.projects}
          onChange={(projects) => onChange((current) => ({ ...current, projects }))}
          showListActions
        />
      );
    case 'education':
      return (
        <EducationSection
          items={data.education}
          onChange={(education) => onChange((current) => ({ ...current, education }))}
          showListActions
        />
      );
    case 'certificates':
      return (
        <CertificatesSection
          items={data.certificates}
          onChange={(certificates) => onChange((current) => ({ ...current, certificates }))}
          showListActions
        />
      );
    case 'skills':
      return (
        <SkillsSection
          skills={data.skills}
          onChange={(skills) => onChange((current) => ({ ...current, skills }))}
        />
      );
    default:
      return null;
  }
}

export default function ResumeDocumentBody({
  data,
  layout,
  onChange,
  hideContactInfo = false,
}: ResumeDocumentBodyProps) {
  const update = onChange ?? noop;

  const mainSections = layout.sections.filter((item) => item.column === 'main');
  const leftSections = layout.sections.filter((item) => item.column === 'left');
  const rightSections = layout.sections.filter((item) => item.column === 'right');

  return (
    <div className={`resume-flow-body ${layout.className}`} data-density={layout.density}>
      <Header
        data={data.personalInfo}
        onChange={(personalInfo) => update((current) => ({ ...current, personalInfo }))}
        hideContactInfo={hideContactInfo}
      />

      {layout.columns === 1 ? (
        <div className="resume-flow-stack">
          {mainSections.map(({ section }) => (
            <div key={section} className="resume-flow-section">
              <SectionBlock section={section} data={data} onChange={update} />
            </div>
          ))}
        </div>
      ) : (
        <div className="resume-flow-split">
          <div className="resume-flow-column resume-flow-column-left">
            {leftSections.map(({ section }) => (
              <div key={section} className="resume-flow-section">
                <SectionBlock section={section} data={data} onChange={update} />
              </div>
            ))}
          </div>
          <div className="resume-flow-v-rule" aria-hidden />
          <div className="resume-flow-column resume-flow-column-right">
            {rightSections.map(({ section }) => (
              <div key={section} className="resume-flow-section">
                <SectionBlock section={section} data={data} onChange={update} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
