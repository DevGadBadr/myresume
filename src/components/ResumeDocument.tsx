'use client';

import type {
  CertEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
} from '@/types/resume';
import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';

interface ResumeDocumentProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
}

const noop = () => {};

export default function ResumeDocument({ data, onChange, hideContactInfo = false }: ResumeDocumentProps) {
  const update = onChange ?? noop;

  return (
    <>
      <Header
        data={data.personalInfo}
        onChange={(personalInfo) => update((current) => ({ ...current, personalInfo }))}
        hideContactInfo={hideContactInfo}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', marginTop: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ExperienceSection
            items={data.experience as ExperienceEntry[]}
            onChange={(experience) => update((current) => ({ ...current, experience }))}
          />
          <CertificatesSection
            items={data.certificates as CertEntry[]}
            onChange={(certificates) => update((current) => ({ ...current, certificates }))}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <EducationSection
            items={data.education as EducationEntry[]}
            onChange={(education) => update((current) => ({ ...current, education }))}
          />
          <SkillsSection
            skills={data.skills}
            onChange={(skills) => update((current) => ({ ...current, skills }))}
          />
          <AboutMeSection
            text={data.about}
            onChange={(about) => update((current) => ({ ...current, about }))}
          />
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <ProjectsSection
          items={data.projects as ProjectEntry[]}
          onChange={(projects) => update((current) => ({ ...current, projects }))}
        />
      </div>
    </>
  );
}
