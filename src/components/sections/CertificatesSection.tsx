'use client';

import type { ReactNode } from 'react';
import type { CertEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';
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

interface CertificatesSectionProps {
  items: CertEntry[];
  onChange: (items: CertEntry[]) => void;
  onlyEntryIds?: string[];
  showHeading?: boolean;
  showListActions?: boolean;
}

interface SortableCertCardProps {
  id: string;
  isEditing: boolean;
  children: ReactNode;
}

function SortableCertCard({ id, isEditing, children }: SortableCertCardProps) {
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
            title="Drag to reorder certificate"
            aria-label="Drag to reorder certificate"
          >
            ⠿
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export default function CertificatesSection({
  items,
  onChange,
  onlyEntryIds,
  showHeading = true,
  showListActions = true,
}: CertificatesSectionProps) {
  const { isEditing } = useEditMode();

  const visibleItems = onlyEntryIds
    ? items.filter((item) => onlyEntryIds.includes(item.id))
    : items;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const certIds = visibleItems.map((item) => item.id);

  const updateItem = (i: number, patch: Partial<CertEntry>) => {
    const updated = { ...items[i], ...patch };
    if ('hours' in patch && (!patch.hours || !patch.hours.trim())) delete updated.hours;
    if ('link' in patch && (!patch.link || !patch.link.trim())) delete updated.link;
    onChange(items.map((item, idx) => (idx === i ? updated : item)));
  };

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    onChange(arrayMove(items, from, to));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = certIds.indexOf(active.id as string);
    const newIdx = certIds.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      onChange(arrayMove(items, oldIdx, newIdx));
    }
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        title: 'Certificate Title',
        issuer: 'Issuer / Platform',
        date: 'Month YYYY',
      },
    ]);

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <section>
      {showHeading && <h2 className="section-heading">Certificates</h2>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={showListActions ? handleDragEnd : () => {}}
      >
        <SortableContext items={certIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {visibleItems.map((item, i) => {
              const sourceIndex = items.findIndex((entry) => entry.id === item.id);
              return (
              <SortableCertCard key={item.id} id={item.id} isEditing={isEditing && showListActions}>
                <div
                  className={`resume-entry ${item.pageBreakBefore ? 'resume-page-break-before' : ''}`}
                >
                {isEditing && showListActions && (
                  <div className="mb-1 flex items-center justify-between gap-2 no-print">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveItem(sourceIndex, sourceIndex - 1)}
                        disabled={sourceIndex === 0}
                        className="rounded border border-gray-200 px-2 py-0.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Move certificate ${item.title} up`}
                        title="Move up"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(sourceIndex, sourceIndex + 1)}
                        disabled={sourceIndex === items.length - 1}
                        className="rounded border border-gray-200 px-2 py-0.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Move certificate ${item.title} down`}
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
                      aria-label={`Remove certificate ${item.title}`}
                      className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs text-red-500 opacity-0 transition-opacity hover:bg-red-200 group-hover:opacity-100"
                      title="Remove certificate"
                    >
                      ×
                    </button>
                  </div>
                )}

                <EditableText
                  value={item.title}
                  onChange={(v) => updateItem(sourceIndex, { title: v })}
                  as="h3"
                  className="font-semibold text-gray-900 text-sm"
                />

                <EditableText
                  value={item.issuer}
                  onChange={(v) => updateItem(sourceIndex, { issuer: v })}
                  as="p"
                  className="text-xs text-[#8B0000] font-medium"
                />

                <div className="flex items-center gap-1.5 mt-0.5">
                  <EditableText
                    value={item.date}
                    onChange={(v) => updateItem(sourceIndex, { date: v })}
                    as="p"
                    className="text-xs text-gray-500"
                  />
                  {!isEditing && item.hours && (
                    <span className="bg-gray-100 text-gray-600 text-[10px] rounded px-1.5 py-0.5">
                      {item.hours}
                    </span>
                  )}
                  {!isEditing && item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-300 text-gray-600 text-[10px] rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors"
                    >
                      View
                    </a>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="text"
                      placeholder="Hours (e.g., 40 Hours)"
                      value={item.hours ?? ''}
                      onChange={(e) => updateItem(sourceIndex, { hours: e.target.value })}
                      onBlur={(e) => updateItem(sourceIndex, { hours: e.currentTarget.value.trim() })}
                      className="flex-1 rounded border border-dashed border-[#8B000030] px-2 py-1 text-xs text-gray-600 outline-none placeholder:text-gray-300 focus:border-[#8B000060]"
                    />
                    <input
                      type="url"
                      placeholder="Certificate URL"
                      value={item.link ?? ''}
                      onChange={(e) => updateItem(sourceIndex, { link: e.target.value })}
                      onBlur={(e) => updateItem(sourceIndex, { link: e.currentTarget.value.trim() })}
                      className="flex-1 rounded border border-dashed border-[#8B000030] px-2 py-1 text-xs text-gray-600 outline-none placeholder:text-gray-300 focus:border-[#8B000060]"
                    />
                  </div>
                )}

                {i < visibleItems.length - 1 && <hr className="mt-3 border-dashed border-gray-200" />}
                </div>
              </SortableCertCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {isEditing && showListActions && !onlyEntryIds && (
        <button
          onClick={addItem}
          className="mt-3 w-full text-sm text-[#8B0000] border border-dashed border-[#8B0000] rounded py-1.5 hover:bg-red-50 transition-colors"
        >
          + Add Certificate
        </button>
      )}
    </section>
  );
}
