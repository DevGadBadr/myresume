'use client';

import type {
  CertEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
} from '@/types/resume';
import { EditModeContext } from '@/context/EditModeContext';

import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';

const noop = () => {};

interface PrintContentProps {
  data: ResumeData;
}

export default function PrintContent({ data }: PrintContentProps) {
  return (
    <EditModeContext.Provider value={{ isEditing: false, toggle: noop }}>
      <main className="bg-white px-8 py-10 text-[13px] text-gray-900 print:px-0 print:py-0">
        <Header data={data.personalInfo} onChange={noop} />
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', marginTop: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <ExperienceSection items={data.experience as ExperienceEntry[]} onChange={noop} />
            <CertificatesSection items={data.certificates as CertEntry[]} onChange={noop} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <EducationSection items={data.education as EducationEntry[]} onChange={noop} />
            <SkillsSection skills={data.skills} onChange={noop} />
            <AboutMeSection text={data.about} onChange={noop} />
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <ProjectsSection items={data.projects as ProjectEntry[]} onChange={noop} />
        </div>
      </main>
    </EditModeContext.Provider>
  );
}
