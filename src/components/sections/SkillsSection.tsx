'use client';

import { useState } from 'react';
import type { SkillEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
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
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface SkillChipProps {
  id: string;
  label: string;
  isEditing: boolean;
  onRemove: () => void;
}

function SkillChip({ id, label, isEditing, onRemove }: SkillChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-[#8B000040] text-[#8B0000] bg-[#8B000008] font-medium"
    >
      {isEditing && (
        <span
          {...attributes}
          {...listeners}
          className="text-[#8B000050] hover:text-[#8B0000] cursor-grab active:cursor-grabbing select-none"
          title="Drag to reorder"
          aria-label={`Drag to reorder ${label}`}
        >
          ⠿
        </span>
      )}
      {label}
      {isEditing && (
        <button
          onClick={onRemove}
          aria-label={`Remove skill ${label}`}
          className="text-[#8B0000] hover:text-red-800 font-bold leading-none ml-0.5"
          title="Remove skill"
        >
          ×
        </button>
      )}
    </span>
  );
}

interface SkillsSectionProps {
  skills: SkillEntry[];
  onChange: (skills: SkillEntry[]) => void;
}

export default function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const { isEditing } = useEditMode();
  const [inputVal, setInputVal] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const skillIds = skills.map((skill) => skill.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = skillIds.indexOf(active.id as string);
    const newIdx = skillIds.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      onChange(arrayMove(skills, oldIdx, newIdx));
    }
  };

  const addSkill = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !skills.some((skill) => skill.label.toLowerCase() === trimmed.toLowerCase())) {
      onChange([
        ...skills,
        {
          id: `skill-${crypto.randomUUID()}`,
          label: trimmed,
        },
      ]);
    }
    setInputVal('');
  };

  const removeSkill = (i: number) => onChange(skills.filter((_, idx) => idx !== i));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputVal);
    }
  };

  return (
    <section>
      <h2 className="section-heading">Fields of Knowledge</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={skillIds} strategy={rectSortingStrategy}>
          <div
            className={`flex flex-wrap gap-1.5 ${
              isEditing ? 'max-h-52 overflow-y-auto pr-2 content-start' : ''
            }`}
          >
            {skills.map((skill, i) => (
              <SkillChip
                key={skillIds[i]}
                id={skillIds[i]}
                label={skill.label}
                isEditing={isEditing}
                onRemove={() => removeSkill(i)}
              />
            ))}

            {isEditing && (
              <span className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => addSkill(inputVal)}
                  placeholder="Add skill..."
                  className="px-2.5 py-1 rounded-full text-xs border border-dashed border-[#8B0000] text-[#8B0000] bg-transparent outline-none w-28 placeholder-[#8B000070]"
                />
              </span>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
