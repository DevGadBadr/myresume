'use client';

import type { ReactNode } from 'react';
import type { ProjectEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';
import WordLikeBulletList from '@/components/editor/WordLikeBulletList';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface ProjectsSectionProps {
  items: ProjectEntry[];
  onChange: (items: ProjectEntry[]) => void;
  onlyEntryIds?: string[];
  showHeading?: boolean;
  showListActions?: boolean;
}

interface SortableProjectCardProps {
  id: string;
  isEditing: boolean;
  children: ReactNode;
}

function SortableProjectCard({ id, isEditing, children }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {isEditing && (
        <div className="absolute -left-5 top-0 hidden md:block">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none text-sm leading-none"
            title="Drag to reorder project"
            aria-label="Drag to reorder project"
          >
            ⠿
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export default function ProjectsSection({
  items,
  onChange,
  onlyEntryIds,
  showHeading = true,
  showListActions = true,
}: ProjectsSectionProps) {
  const { isEditing } = useEditMode();

  const visibleItems = onlyEntryIds
    ? items.filter((item) => onlyEntryIds.includes(item.id))
    : items;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const projectIds = visibleItems.map((item) => item.id);

  const updateItem = (i: number, patch: Partial<ProjectEntry>) => {
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const updateDeployment = (
    itemIdx: number,
    patch: Partial<NonNullable<ProjectEntry['deployment']>>
  ) => {
    const current = items[itemIdx].deployment ?? { url: '', credentials: [] };
    const next = {
      ...current,
      ...patch,
    };
    const nextUrl = next.url?.trim() ?? '';
    const nextCredentials =
      next.credentials?.filter((credential) => credential.label || credential.value) ?? [];

    updateItem(itemIdx, {
      deployment:
        nextUrl || nextCredentials.length > 0
          ? {
              url: nextUrl,
              ...(nextCredentials.length > 0 ? { credentials: nextCredentials } : {}),
            }
          : undefined,
    });
  };

  const addDeploymentCredential = (itemIdx: number) => {
    const credentials = items[itemIdx].deployment?.credentials ?? [];
    updateDeployment(itemIdx, {
      credentials: [
        ...credentials,
        { id: crypto.randomUUID(), label: 'Username', value: '' },
      ],
    });
  };

  const updateDeploymentCredential = (
    itemIdx: number,
    credentialIdx: number,
    patch: { label?: string; value?: string }
  ) => {
    const credentials = [...(items[itemIdx].deployment?.credentials ?? [])];
    credentials[credentialIdx] = {
      ...credentials[credentialIdx],
      ...patch,
    };
    updateDeployment(itemIdx, { credentials });
  };

  const removeDeploymentCredential = (itemIdx: number, credentialIdx: number) => {
    updateDeployment(itemIdx, {
      credentials: (items[itemIdx].deployment?.credentials ?? []).filter(
        (_, index) => index !== credentialIdx
      ),
    });
  };

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    onChange(arrayMove(items, from, to));
  };

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = projectIds.indexOf(active.id as string);
    const newIdx = projectIds.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      onChange(arrayMove(items, oldIdx, newIdx));
    }
  };

  const updateTag = (itemIdx: number, tagIdx: number, val: string) => {
    const tags = [...items[itemIdx].tags];
    tags[tagIdx] = val;
    updateItem(itemIdx, { tags });
  };

  const addTag = (itemIdx: number) => {
    updateItem(itemIdx, { tags: [...items[itemIdx].tags, 'Technology'] });
  };

  const removeTag = (itemIdx: number, tagIdx: number) => {
    updateItem(itemIdx, { tags: items[itemIdx].tags.filter((_, i) => i !== tagIdx) });
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        title: 'Project Title',
        description: 'Tech stack / brief description',
        bullets: ['Key feature or achievement'],
        tags: ['React', 'Node.js'],
      },
    ]);
  };

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <section>
      {showHeading && <h2 className="section-heading">Projects</h2>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={showListActions ? handleProjectDragEnd : () => {}}
      >
        <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
            {visibleItems.map((item, i) => {
              const sourceIndex = items.findIndex((entry) => entry.id === item.id);
              const deploymentCredentials = item.deployment?.credentials ?? [];
              const hasDeploymentDetails =
                Boolean(item.deployment?.url) ||
                deploymentCredentials.length > 0;

              return (
                <SortableProjectCard key={item.id} id={item.id} isEditing={isEditing && showListActions}>
                  <div
                    className={`resume-entry ${item.pageBreakBefore ? 'resume-page-break-before' : ''}`}
                  >
                  {isEditing && showListActions && (
                    <div className="mb-2 flex items-center justify-between gap-2 no-print">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <button
                          type="button"
                          onClick={() => moveItem(sourceIndex, sourceIndex - 1)}
                          disabled={sourceIndex === 0}
                          className="rounded border border-gray-200 px-2 py-0.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move project ${item.title} up`}
                          title="Move up"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(sourceIndex, sourceIndex + 1)}
                          disabled={sourceIndex === items.length - 1}
                          className="rounded border border-gray-200 px-2 py-0.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move project ${item.title} down`}
                          title="Move down"
                        >
                          Down
                        </button>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={Boolean(item.pageBreakBefore)}
                            onChange={(e) =>
                              updateItem(sourceIndex, {
                                pageBreakBefore: e.target.checked ? true : undefined,
                              })
                            }
                          />
                          Page break before
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(sourceIndex)}
                        aria-label={`Remove project ${item.title}`}
                        className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs text-red-500 opacity-0 transition-opacity hover:bg-red-200 group-hover:opacity-100"
                        title="Remove project"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <EditableText
                        value={item.title}
                        onChange={(v) => updateItem(sourceIndex, { title: v })}
                        as="h3"
                        className="font-semibold text-gray-900 text-sm"
                      />
                    </div>

                    <EditableText
                      value={item.description}
                      onChange={(v) => updateItem(sourceIndex, { description: v })}
                      as="p"
                      className="text-xs text-[#8B0000] font-medium mt-0.5"
                    />

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.map((tag, ti) => (
                        <span
                          key={ti}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs bg-[#8B000010] text-[#8B0000] border border-[#8B000030]"
                        >
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={tag}
                                onChange={(e) => updateTag(sourceIndex, ti, e.target.value)}
                                className="bg-transparent outline-none w-16 text-xs text-[#8B0000]"
                                style={{ fontFamily: 'inherit' }}
                              />
                              <button
                                onClick={() => removeTag(sourceIndex, ti)}
                                aria-label={`Remove tag ${tag}`}
                                className="text-red-400 hover:text-red-600 text-xs"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            tag
                          )}
                        </span>
                      ))}
                      {isEditing && (
                        <button
                          onClick={() => addTag(sourceIndex)}
                          className="px-2 py-0.5 rounded text-xs border border-dashed border-[#8B0000] text-[#8B0000] hover:bg-red-50"
                        >
                          + Tag
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <WordLikeBulletList
                        bullets={item.bullets}
                        onChange={(bullets) => updateItem(sourceIndex, { bullets })}
                      />
                    ) : (
                      <ul className="mt-2 space-y-1 pl-3">
                        {item.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-xs text-gray-700">
                            <span className="text-[#8B0000] mt-0.5 shrink-0">•</span>
                            <span className="flex-1 leading-relaxed whitespace-pre-wrap">
                              {bullet}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isEditing && (
                      <div className="mt-2 space-y-2 rounded border border-dashed border-gray-300 bg-gray-50/60 px-3 py-2">
                        <div className="rounded border border-[#8B000020] bg-white px-3 py-2">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-wide text-[#8B0000]">
                                Deployment
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Optional demo URL and tester credentials
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="url"
                              placeholder="https://your-app-demo.com"
                              value={item.deployment?.url ?? ''}
                              onChange={(e) =>
                                updateDeployment(sourceIndex, { url: e.target.value })
                              }
                              onBlur={(e) =>
                                updateDeployment(sourceIndex, { url: e.currentTarget.value.trim() })
                              }
                              className="w-full rounded border border-dashed border-[#8B000030] px-2 py-1 text-xs text-gray-600 outline-none placeholder:text-gray-300 focus:border-[#8B000060]"
                            />

                            <div className="space-y-2">
                              {(item.deployment?.credentials ?? []).map((credential, credentialIdx) => (
                                <div
                                  key={credential.id}
                                  className="grid gap-2 rounded border border-dashed border-[#8B000020] p-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]"
                                >
                                  <input
                                    type="text"
                                    placeholder="Field name"
                                    value={credential.label}
                                    onChange={(e) =>
                                      updateDeploymentCredential(sourceIndex, credentialIdx, {
                                        label: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      updateDeploymentCredential(sourceIndex, credentialIdx, {
                                        label: e.currentTarget.value.trim(),
                                      })
                                    }
                                    className="w-full rounded border border-dashed border-[#8B000030] px-2 py-1 text-xs text-gray-600 outline-none placeholder:text-gray-300 focus:border-[#8B000060]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Value"
                                    value={credential.value}
                                    onChange={(e) =>
                                      updateDeploymentCredential(sourceIndex, credentialIdx, {
                                        value: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      updateDeploymentCredential(sourceIndex, credentialIdx, {
                                        value: e.currentTarget.value.trim(),
                                      })
                                    }
                                    className="w-full rounded border border-dashed border-[#8B000030] px-2 py-1 text-xs text-gray-600 outline-none placeholder:text-gray-300 focus:border-[#8B000060]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeDeploymentCredential(sourceIndex, credentialIdx)}
                                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                                    aria-label={`Remove credential ${credential.label || credentialIdx + 1}`}
                                    title="Remove credential"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => addDeploymentCredential(sourceIndex)}
                                className="rounded border border-dashed border-[#8B000040] px-2 py-1 text-xs text-[#8B0000] transition-colors hover:bg-red-50"
                              >
                                + Add credential field
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isEditing && hasDeploymentDetails && (
                      <div className="mt-2 rounded border border-[#8B000020] bg-[#8B000008] px-3 py-2 text-xs">
                        {item.deployment?.url && (
                          <p className="text-gray-700">
                            <span className="font-semibold text-gray-900">Deployment:</span>{' '}
                            <a
                              href={item.deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8B0000] hover:underline"
                            >
                              {item.deployment.url}
                            </a>
                          </p>
                        )}
                        {deploymentCredentials.length > 0 && (
                          <div className="mt-1 text-gray-600">
                            <span className="font-semibold text-gray-900">
                              Credentials for testing:
                            </span>{' '}
                            {deploymentCredentials.map((credential, index) => (
                              <span key={credential.id}>
                                <span className="font-medium text-gray-800">
                                  {credential.label || 'Field'}:
                                </span>{' '}
                                <span>{credential.value}</span>
                                {index < deploymentCredentials.length - 1 && <span> </span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {i < visibleItems.length - 1 && <hr className="mt-4 border-dashed border-gray-200" />}
                  </div>
                </SortableProjectCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {isEditing && showListActions && (
        <button
          onClick={addItem}
          className="mt-4 w-full text-sm text-[#8B0000] border border-dashed border-[#8B0000] rounded py-1.5 hover:bg-red-50 transition-colors"
        >
          + Add Project
        </button>
      )}
    </section>
  );
}
