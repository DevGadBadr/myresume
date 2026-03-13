'use client';

import type { ExperienceEntry } from '@/types/resume';
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

interface ExperienceSectionProps {
  items: ExperienceEntry[];
  onChange: (items: ExperienceEntry[]) => void;
}

export default function ExperienceSection({ items, onChange }: ExperienceSectionProps) {
  const { isEditing } = useEditMode();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const updateItem = (i: number, patch: Partial<ExperienceEntry>) => {
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
    updateItem(itemIdx, { bullets: [...items[itemIdx].bullets, 'New achievement or responsibility'] });
  };

  const removeBullet = (itemIdx: number, bulletIdx: number) => {
    updateItem(itemIdx, { bullets: items[itemIdx].bullets.filter((_, i) => i !== bulletIdx) });
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        role: 'New Role',
        roleSubtitle: 'Role Description',
        company: 'Company Name',
        period: 'MM/YYYY – Ongoing',
        bullets: ['Describe your work here'],
      },
    ]);
  };

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <section>
      <h2 className="section-heading">Experience</h2>
      <div className="space-y-5">
        {items.map((item, i) => {
          const bulletIds = item.bullets.map((_, bi) => `${item.id}-b-${bi}`);
          return (
            <div key={item.id} className="relative group">
              {isEditing && (
                <button
                  onClick={() => removeItem(i)}
                  aria-label={`Remove experience ${item.role}`}
                  className="absolute -right-1 -top-1 z-10 w-6 h-6 flex items-center justify-center bg-red-100 text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  title="Remove entry"
                >
                  ×
                </button>
              )}

              <div className="flex items-start justify-between gap-2 mb-0.5">
                <div className="flex-1">
                  <EditableText
                    value={item.role}
                    onChange={(v) => updateItem(i, { role: v })}
                    as="h3"
                    className="font-semibold text-gray-900 text-sm"
                  />
                  <EditableText
                    value={item.roleSubtitle}
                    onChange={(v) => updateItem(i, { roleSubtitle: v })}
                    as="p"
                    className="text-xs text-[#8B0000] font-medium"
                  />
                </div>
                <div className="text-right shrink-0">
                  <EditableText
                    value={item.period}
                    onChange={(v) => updateItem(i, { period: v })}
                    as="p"
                    className="text-xs text-gray-500"
                    placeholder="Date range"
                  />
                  <EditableText
                    value={item.company}
                    onChange={(v) => updateItem(i, { company: v })}
                    as="p"
                    className="text-xs font-semibold text-gray-700"
                    placeholder="Company"
                  />
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleBulletDragEnd(i, e)}
              >
                <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
                  <ul className="mt-1.5 space-y-1 pl-3">
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
          + Add Experience
        </button>
      )}
    </section>
  );
}
