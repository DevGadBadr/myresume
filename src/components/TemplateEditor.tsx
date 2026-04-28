'use client';

import type { ResumeData, ResumeTemplate, ResumeTemplateSelection } from '@/types/resume';
import PaginatedResume from '@/components/PaginatedResume';
import { deriveResumeForTemplate } from '@/lib/resume-template';

interface TemplateEditorProps {
  data: ResumeData;
  activeTemplateId: string;
  onActiveTemplateChange: (templateId: string) => void;
  onChange: React.Dispatch<React.SetStateAction<ResumeData>>;
}

type SelectionListKey =
  | 'experienceIds'
  | 'projectIds'
  | 'skillIds'
  | 'educationIds'
  | 'certificateIds';

function createTemplateId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'template'}-${crypto.randomUUID().slice(0, 8)}`;
}

function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function moveInList(list: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function allBulletIndexes(length: number) {
  return Array.from({ length }, (_, index) => index);
}

export default function TemplateEditor({
  data,
  activeTemplateId,
  onActiveTemplateChange,
  onChange,
}: TemplateEditorProps) {
  const template =
    data.templates.find((item) => item.id === activeTemplateId) ?? data.templates[0];
  const derived = deriveResumeForTemplate(data, template?.id);

  const updateTemplate = (templateId: string, patch: Partial<ResumeTemplate>) => {
    onChange((current) => ({
      ...current,
      templates: current.templates.map((item) =>
        item.id === templateId ? { ...item, ...patch } : item
      ),
      activeTemplateId: templateId,
    }));
  };

  const updateSelected = (
    key: SelectionListKey,
    id: string,
    selectedPatch?: Partial<ResumeTemplateSelection>
  ) => {
    if (!template) return;
    updateTemplate(template.id, {
      selected: {
        ...template.selected,
        [key]: toggleInList(template.selected[key], id),
        ...selectedPatch,
      },
    });
  };

  const moveSelected = (key: SelectionListKey, from: number, to: number) => {
    if (!template) return;
    updateTemplate(template.id, {
      selected: {
        ...template.selected,
        [key]: moveInList(template.selected[key], from, to),
      },
    });
  };

  const toggleBullet = (
    itemId: string,
    bulletIndex: number,
    bulletCount: number,
    mapKey: 'experienceBulletIndexes' | 'projectBulletIndexes'
  ) => {
    if (!template) return;
    const currentMap = template.selected[mapKey] ?? {};
    const currentIndexes = currentMap[itemId] ?? allBulletIndexes(bulletCount);
    const nextIndexes = currentIndexes.includes(bulletIndex)
      ? currentIndexes.filter((index) => index !== bulletIndex)
      : [...currentIndexes, bulletIndex].sort((a, b) => a - b);

    updateTemplate(template.id, {
      selected: {
        ...template.selected,
        [mapKey]: {
          ...currentMap,
          [itemId]: nextIndexes,
        },
      },
    });
  };

  const createTemplate = () => {
    const name = 'New Template';
    const id = createTemplateId(name);
    const nextTemplate: ResumeTemplate = {
      id,
      name,
      hideContactInfo: false,
      selected: {
        experienceIds: data.experience.map((item) => item.id),
        projectIds: data.projects.map((item) => item.id),
        skillIds: data.skills.map((item) => item.id),
        educationIds: data.education.map((item) => item.id),
        certificateIds: data.certificates.map((item) => item.id),
      },
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
    const copy = {
      ...template,
      id,
      name: `${template.name} Copy`,
      selected: {
        ...template.selected,
        experienceBulletIndexes: template.selected.experienceBulletIndexes
          ? { ...template.selected.experienceBulletIndexes }
          : undefined,
        projectBulletIndexes: template.selected.projectBulletIndexes
          ? { ...template.selected.projectBulletIndexes }
          : undefined,
      },
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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]">
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
          <label className="block text-xs font-semibold text-gray-600">
            Summary override
            <textarea
              value={template.summaryOverride ?? ''}
              onChange={(event) =>
                updateTemplate(template.id, { summaryOverride: event.target.value })
              }
              rows={3}
              placeholder={data.about}
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

        <div className="mt-4 max-h-[calc(100vh-18rem)] space-y-5 overflow-y-auto pr-1">
          <SelectionGroup title="Experience">
            {data.experience.map((item) => {
              const included = template.selected.experienceIds.includes(item.id);
              const selectedIndex = template.selected.experienceIds.indexOf(item.id);
              const selectedBullets =
                template.selected.experienceBulletIndexes?.[item.id] ??
                allBulletIndexes(item.bullets.length);

              return (
                <div key={item.id} className="rounded border border-gray-200 p-2">
                  <SelectionHeader
                    checked={included}
                    label={`${item.role} - ${item.company}`}
                    onToggle={() => updateSelected('experienceIds', item.id)}
                    onMoveUp={() => moveSelected('experienceIds', selectedIndex, selectedIndex - 1)}
                    onMoveDown={() => moveSelected('experienceIds', selectedIndex, selectedIndex + 1)}
                    moveDisabled={!included}
                  />
                  {included && (
                    <BulletChecklist
                      bullets={item.bullets}
                      selectedIndexes={selectedBullets}
                      onToggle={(index) =>
                        toggleBullet(item.id, index, item.bullets.length, 'experienceBulletIndexes')
                      }
                    />
                  )}
                </div>
              );
            })}
          </SelectionGroup>

          <SelectionGroup title="Projects">
            {data.projects.map((item) => {
              const included = template.selected.projectIds.includes(item.id);
              const selectedIndex = template.selected.projectIds.indexOf(item.id);
              const selectedBullets =
                template.selected.projectBulletIndexes?.[item.id] ??
                allBulletIndexes(item.bullets.length);

              return (
                <div key={item.id} className="rounded border border-gray-200 p-2">
                  <SelectionHeader
                    checked={included}
                    label={item.title}
                    onToggle={() => updateSelected('projectIds', item.id)}
                    onMoveUp={() => moveSelected('projectIds', selectedIndex, selectedIndex - 1)}
                    onMoveDown={() => moveSelected('projectIds', selectedIndex, selectedIndex + 1)}
                    moveDisabled={!included}
                  />
                  {included && (
                    <BulletChecklist
                      bullets={item.bullets}
                      selectedIndexes={selectedBullets}
                      onToggle={(index) =>
                        toggleBullet(item.id, index, item.bullets.length, 'projectBulletIndexes')
                      }
                    />
                  )}
                </div>
              );
            })}
          </SelectionGroup>

          <SelectionGroup title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill) => (
                <label
                  key={skill.id}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={template.selected.skillIds.includes(skill.id)}
                    onChange={() => updateSelected('skillIds', skill.id)}
                  />
                  {skill.label}
                </label>
              ))}
            </div>
          </SelectionGroup>

          <SelectionGroup title="Education">
            {data.education.map((item) => (
              <CheckboxRow
                key={item.id}
                checked={template.selected.educationIds.includes(item.id)}
                label={`${item.degree} - ${item.institution}`}
                onToggle={() => updateSelected('educationIds', item.id)}
              />
            ))}
          </SelectionGroup>

          <SelectionGroup title="Certificates">
            {data.certificates.map((item) => (
              <CheckboxRow
                key={item.id}
                checked={template.selected.certificateIds.includes(item.id)}
                label={`${item.title} - ${item.issuer}`}
                onToggle={() => updateSelected('certificateIds', item.id)}
              />
            ))}
          </SelectionGroup>
        </div>
      </aside>

      <div>
        <PaginatedResume
          data={derived.data}
          hideContactInfo={derived.hideContactInfo}
          showPageGaps
          showShadow
        />
      </div>
    </div>
  );
}

function SelectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SelectionHeader({
  checked,
  label,
  onToggle,
  onMoveUp,
  onMoveDown,
  moveDisabled,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  moveDisabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <CheckboxRow checked={checked} label={label} onToggle={onToggle} />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={moveDisabled}
          className="rounded border px-1.5 py-0.5 text-[11px] disabled:opacity-40"
        >
          Up
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={moveDisabled}
          className="rounded border px-1.5 py-0.5 text-[11px] disabled:opacity-40"
        >
          Down
        </button>
      </div>
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-start gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5" />
      <span className="min-w-0 flex-1">{label}</span>
    </label>
  );
}

function BulletChecklist({
  bullets,
  selectedIndexes,
  onToggle,
}: {
  bullets: string[];
  selectedIndexes: number[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="mt-2 space-y-1 border-l border-gray-200 pl-3">
      {bullets.map((bullet, index) => (
        <label key={index} className="flex items-start gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={selectedIndexes.includes(index)}
            onChange={() => onToggle(index)}
            className="mt-0.5"
          />
          <span>{bullet}</span>
        </label>
      ))}
    </div>
  );
}
