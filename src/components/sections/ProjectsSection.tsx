'use client';

import type { ProjectEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';
import SortableBullet from '@/components/SortableBullet';
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
}

export default function ProjectsSection({ items, onChange }: ProjectsSectionProps) {
  const { isEditing } = useEditMode();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const updateItem = (i: number, patch: Partial<ProjectEntry>) => {
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const handleBulletDragEnd = (itemIdx: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const bullets = items[itemIdx].bullets;
    const oldIdx = bullets.findIndex((_, i) => `${items[itemIdx].id}-b-${i}` === active.id);
    const newIdx = bullets.findIndex((_, i) => `${items[itemIdx].id}-b-${i}` === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      updateItem(itemIdx, { bullets: arrayMove(bullets, oldIdx, newIdx) });
    }
  };

  const updateBullet = (itemIdx: number, bulletIdx: number, val: string) => {
    const bullets = [...items[itemIdx].bullets];
    bullets[bulletIdx] = val;
    updateItem(itemIdx, { bullets });
  };

  const addBullet = (itemIdx: number) => {
    updateItem(itemIdx, { bullets: [...items[itemIdx].bullets, 'Key achievement or feature'] });
  };

  const removeBullet = (itemIdx: number, bulletIdx: number) => {
    updateItem(itemIdx, { bullets: items[itemIdx].bullets.filter((_, i) => i !== bulletIdx) });
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
      <h2 className="section-heading">Projects</h2>
      <div className="space-y-5">
        {items.map((item, i) => {
          const bulletIds = item.bullets.map((_, bi) => `${item.id}-b-${bi}`);
          return (
            <div key={item.id} className="relative group">
              {isEditing && (
                <button
                  onClick={() => removeItem(i)}
                  aria-label={`Remove project ${item.title}`}
                  className="absolute -right-1 -top-1 z-10 w-6 h-6 flex items-center justify-center bg-red-100 text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  title="Remove project"
                >
                  ×
                </button>
              )}

              <EditableText
                value={item.title}
                onChange={(v) => updateItem(i, { title: v })}
                as="h3"
                className="font-semibold text-gray-900 text-sm"
              />
              <EditableText
                value={item.description}
                onChange={(v) => updateItem(i, { description: v })}
                as="p"
                className="text-xs text-[#8B0000] font-medium mt-0.5"
              />

              {/* Tech tags */}
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
                          onChange={(e) => updateTag(i, ti, e.target.value)}
                          className="bg-transparent outline-none w-16 text-xs text-[#8B0000]"
                          style={{ fontFamily: 'inherit' }}
                        />
                        <button
                          onClick={() => removeTag(i, ti)}
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
                    onClick={() => addTag(i)}
                    className="px-2 py-0.5 rounded text-xs border border-dashed border-[#8B0000] text-[#8B0000] hover:bg-red-50"
                  >
                    + Tag
                  </button>
                )}
              </div>

              {/* Sortable bullets */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleBulletDragEnd(i, e)}
              >
                <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
                  <ul className="mt-2 space-y-1 pl-3">
                    {item.bullets.map((bullet, bi) => (
                      <SortableBullet
                        key={bulletIds[bi]}
                        id={bulletIds[bi]}
                        value={bullet}
                        isEditing={isEditing}
                        onChange={(v) => updateBullet(i, bi, v)}
                        onRemove={() => removeBullet(i, bi)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>

              {isEditing && (
                <button
                  onClick={() => addBullet(i)}
                  className="mt-1.5 ml-4 text-xs text-[#8B0000] hover:underline"
                >
                  + Add bullet
                </button>
              )}

              {i < items.length - 1 && <hr className="mt-4 border-dashed border-gray-200" />}
            </div>
          );
        })}
      </div>

      {isEditing && (
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
