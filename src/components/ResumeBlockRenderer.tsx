'use client';

import type { ResumeBlock } from '@/lib/resume-blocks';
import type { ResumeData, ResumeLayoutSettings, SectionKey } from '@/types/resume';
import BlockShell from '@/components/BlockShell';
import Header from '@/components/sections/Header';
import AboutMeSection from '@/components/sections/AboutMeSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import EducationSection from '@/components/sections/EducationSection';
import CertificatesSection from '@/components/sections/CertificatesSection';
import LayoutSpacer, { LayoutPageBreakMarker } from '@/components/LayoutSpacer';
import LayoutAnchorToolbar from '@/components/LayoutAnchorToolbar';
import SectionMinHeightControl from '@/components/SectionMinHeightControl';
import { cloneLayoutSettings, normalizeLayoutSettings } from '@/lib/layout-settings';

const SECTION_HEADINGS: Record<SectionKey, string> = {
  experience: 'Experience',
  certificates: 'Certificates',
  education: 'Education',
  skills: 'Skills',
  about: 'About Me',
  projects: 'Projects',
};

interface ResumeBlockRendererProps {
  block: ResumeBlock;
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
  sectionMinHeightMm?: number;
  onLayoutChange?: (
    updater: (layout: ResumeLayoutSettings) => ResumeLayoutSettings
  ) => void;
  onSpacerResize?: (controlId: string, heightMm: number) => void;
}

const noop = () => {};

export default function ResumeBlockRenderer({
  block,
  data,
  onChange,
  hideContactInfo = false,
  sectionMinHeightMm,
  onLayoutChange,
  onSpacerResize,
}: ResumeBlockRendererProps) {
  const update = onChange ?? noop;
  const layout = normalizeLayoutSettings(data.layout);

  const sectionStyle =
    sectionMinHeightMm && sectionMinHeightMm > 0
      ? { minHeight: `${sectionMinHeightMm}mm` }
      : undefined;

  switch (block.kind) {
    case 'header':
      return (
        <BlockShell blockId={block.id}>
          <Header
            data={data.personalInfo}
            onChange={(personalInfo) => update((current) => ({ ...current, personalInfo }))}
            hideContactInfo={hideContactInfo}
          />
          {onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterHeader' }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'sectionHeading':
      return (
        <BlockShell blockId={block.id} section={block.section} style={sectionStyle}>
          <h2 className="section-heading">{SECTION_HEADINGS[block.section!]}</h2>
          {block.section && onLayoutChange && (
            <>
              <LayoutAnchorToolbar
                anchor={{ kind: 'beforeSection', section: block.section }}
                layout={layout}
                onLayoutChange={onLayoutChange}
              />
              <SectionMinHeightControl
                section={block.section}
                minHeightMm={layout.sections?.[block.section]?.minHeightMm}
                onChange={(minHeightMm) =>
                  onLayoutChange((current) => {
                    const next = cloneLayoutSettings(current);
                    const sections = { ...next.sections };
                    if (minHeightMm === undefined) {
                      delete sections[block.section!];
                    } else {
                      sections[block.section!] = {
                        ...sections[block.section!],
                        minHeightMm,
                      };
                    }
                    next.sections = sections;
                    return next;
                  })
                }
              />
            </>
          )}
        </BlockShell>
      );
    case 'experienceEntry':
      return (
        <BlockShell blockId={block.id} section="experience">
          <ExperienceSection
            items={data.experience}
            onChange={(experience) => update((current) => ({ ...current, experience }))}
            onlyEntryIds={block.entryId ? [block.entryId] : undefined}
            showHeading={false}
            showListActions={false}
          />
          {block.entryId && onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterEntry', section: 'experience', entryId: block.entryId }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'certificateEntry':
      return (
        <BlockShell blockId={block.id} section="certificates">
          <CertificatesSection
            items={data.certificates}
            onChange={(certificates) => update((current) => ({ ...current, certificates }))}
            onlyEntryIds={block.entryId ? [block.entryId] : undefined}
            showHeading={false}
            showListActions={false}
          />
          {block.entryId && onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterEntry', section: 'certificates', entryId: block.entryId }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'educationEntry':
      return (
        <BlockShell blockId={block.id} section="education">
          <EducationSection
            items={data.education}
            onChange={(education) => update((current) => ({ ...current, education }))}
            onlyEntryIds={block.entryId ? [block.entryId] : undefined}
            showHeading={false}
            showListActions={false}
          />
          {block.entryId && onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterEntry', section: 'education', entryId: block.entryId }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'skills':
      return (
        <BlockShell blockId={block.id} section="skills" style={sectionStyle}>
          <SkillsSection
            skills={data.skills}
            onChange={(skills) => update((current) => ({ ...current, skills }))}
          />
          {onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterSection', section: 'skills' }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'about':
      return (
        <BlockShell blockId={block.id} section="about" style={sectionStyle}>
          <AboutMeSection
            text={data.about}
            onChange={(about) => update((current) => ({ ...current, about }))}
            showHeading={false}
          />
          {onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterSection', section: 'about' }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'projectEntry':
      return (
        <BlockShell blockId={block.id} section="projects">
          <ProjectsSection
            items={data.projects}
            onChange={(projects) => update((current) => ({ ...current, projects }))}
            onlyEntryIds={block.entryId ? [block.entryId] : undefined}
            showHeading={false}
            showListActions={false}
          />
          {block.entryId && onLayoutChange && (
            <LayoutAnchorToolbar
              anchor={{ kind: 'afterEntry', section: 'projects', entryId: block.entryId }}
              layout={layout}
              onLayoutChange={onLayoutChange}
            />
          )}
        </BlockShell>
      );
    case 'spacer':
      return (
        <LayoutSpacer
          blockId={block.id}
          controlId={block.controlId!}
          heightMm={block.heightMm ?? 8}
          onResize={
            onSpacerResize ? (heightMm) => onSpacerResize(block.controlId!, heightMm) : undefined
          }
        />
      );
    case 'pageBreak':
      return <LayoutPageBreakMarker blockId={block.id} />;
    default:
      return null;
  }
}
