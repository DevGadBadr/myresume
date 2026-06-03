'use client';

import { useCallback } from 'react';
import type { ResumeData, ResumeTemplate, ResumeTemplateContent } from '@/types/resume';
import PaginatedResume from '@/components/PaginatedResume';
import {
  assembleTemplateResume,
  deepCloneContent,
  importSectionFromMain,
  type TemplateContentSectionKey,
} from '@/lib/template-content';

interface TemplateEditorProps {
  data: ResumeData;
  activeTemplateId: string;
  onActiveTemplateChange: (templateId: string) => void;
  onChange: React.Dispatch<React.SetStateAction<ResumeData>>;
  showPageGuides?: boolean;
  showSectionGuides?: boolean;
}

const IMPORT_SECTIONS: { key: TemplateContentSectionKey | 'all'; label: string }[] = [
  { key: 'all', label: 'All sections' },
  { key: 'about', label: 'About' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'certificates', label: 'Certificates' },
];

function createTemplateId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'template'}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function TemplateEditor({
  data,
  activeTemplateId,
  onActiveTemplateChange,
  onChange,
  showPageGuides = false,
  showSectionGuides = false,
}: TemplateEditorProps) {
  const template =
    data.templates.find((item) => item.id === activeTemplateId) ?? data.templates[0];

  const updateTemplate = useCallback(
    (templateId: string, patch: Partial<ResumeTemplate>) => {
      onChange((current) => ({
        ...current,
        templates: current.templates.map((item) =>
          item.id === templateId ? { ...item, ...patch } : item
        ),
        activeTemplateId: templateId,
      }));
    },
    [onChange]
  );

  const updateTemplateContent = useCallback(
    (templateId: string, updater: (content: ResumeTemplateContent) => ResumeTemplateContent) => {
      onChange((current) => ({
        ...current,
        templates: current.templates.map((item) =>
          item.id === templateId
            ? { ...item, content: updater(item.content) }
            : item
        ),
        activeTemplateId: templateId,
      }));
    },
    [onChange]
  );

  const handleTemplateResumeChange = useCallback(
    (updater: React.SetStateAction<ResumeData>) => {
      if (!template) return;

      onChange((current) => {
        const active = current.templates.find((item) => item.id === template.id) ?? template;
        const assembled = assembleTemplateResume(current, active);
        const nextAssembled =
          typeof updater === 'function' ? updater(assembled) : updater;

        return {
          ...current,
          templates: current.templates.map((item) =>
            item.id === template.id
              ? {
                  ...item,
                  content: {
                    about: nextAssembled.about,
                    experience: nextAssembled.experience,
                    projects: nextAssembled.projects,
                    skills: nextAssembled.skills,
                    education: nextAssembled.education,
                    certificates: nextAssembled.certificates,
                    layout: nextAssembled.layout,
                  },
                }
              : item
          ),
          activeTemplateId: template.id,
        };
      });
    },
    [onChange, template]
  );

  const importFromMain = (section: TemplateContentSectionKey | 'all') => {
    if (!template) return;

    const label =
      IMPORT_SECTIONS.find((item) => item.key === section)?.label ?? 'selected sections';
    const confirmed = window.confirm(
      `Replace "${label}" in "${template.name}" with a copy from the library? This cannot be undone.`
    );
    if (!confirmed) return;

    updateTemplateContent(template.id, (content) => {
      if (section === 'all') {
        return deepCloneContent(data);
      }
      return importSectionFromMain(content, data, section);
    });
  };

  const createTemplate = () => {
    const name = 'New Template';
    const id = createTemplateId(name);
    const nextTemplate: ResumeTemplate = {
      id,
      name,
      hideContactInfo: false,
      content: deepCloneContent(data),
    };

    onChange((current) => ({
      ...current,
      activeTemplateId: id,
      templates: [...current.templates, nextTemplate],
    }));
    onActiveTemplateChange(id);
  };

  const duplicateTemplate = () => {
    if (!template) return;
    const id = createTemplateId(`${template.name} Copy`);
    const copy: ResumeTemplate = {
      ...template,
      id,
      name: `${template.name} Copy`,
      content: deepCloneContent(template.content),
    };

    onChange((current) => ({
      ...current,
      activeTemplateId: id,
      templates: [...current.templates, copy],
    }));
    onActiveTemplateChange(id);
  };

  const deleteTemplate = () => {
    if (!template || data.templates.length <= 1) return;
    const nextTemplates = data.templates.filter((item) => item.id !== template.id);
    const nextId = nextTemplates[0].id;
    onChange((current) => ({
      ...current,
      activeTemplateId: nextId,
      templates: nextTemplates,
    }));
    onActiveTemplateChange(nextId);
  };

  if (!template) {
    return null;
  }

  const previewData = assembleTemplateResume(data, template);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      <aside className="no-print rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={template.id}
            onChange={(event) => onActiveTemplateChange(event.target.value)}
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            {data.templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={createTemplate} className="rounded border px-2 py-1 text-xs">
            New
          </button>
          <button type="button" onClick={duplicateTemplate} className="rounded border px-2 py-1 text-xs">
            Duplicate
          </button>
          <button
            type="button"
            onClick={deleteTemplate}
            disabled={data.templates.length <= 1}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-40"
          >
            Delete
          </button>
        </div>

        <div className="space-y-3 border-b border-gray-200 pb-4">
          <label className="block text-xs font-semibold text-gray-600">
            Template name
            <input
              value={template.name}
              onChange={(event) => updateTemplate(template.id, { name: event.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-gray-600">
            Target title override
            <input
              value={template.targetTitle ?? ''}
              onChange={(event) =>
                updateTemplate(template.id, { targetTitle: event.target.value })
              }
              placeholder={data.personalInfo.title}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm font-normal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={template.hideContactInfo}
              onChange={(event) =>
                updateTemplate(template.id, { hideContactInfo: event.target.checked })
              }
            />
            Hide contact information in this template
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Import from library
          </h3>
          <p className="text-xs text-gray-500">
            Copy content from the Library workspace into this template. Library edits do not sync
            automatically.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {IMPORT_SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => importFromMain(section.key)}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div>
        <PaginatedResume
          data={previewData}
          onChange={handleTemplateResumeChange}
          hideContactInfo={template.hideContactInfo}
          showPageGaps
          showShadow
          showPageGuides={showPageGuides}
          showSectionGuides={showSectionGuides}
        />
      </div>
    </div>
  );
}
