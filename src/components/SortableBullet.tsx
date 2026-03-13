'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBulletProps {
  id: string;
  value: string;
  isEditing: boolean;
  onChange: (val: string) => void;
  onRemove: () => void;
}

export default function SortableBullet({ id, value, isEditing, onChange, onRemove }: SortableBulletProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 text-xs text-gray-700 group/bullet"
    >
      {isEditing && (
        <span
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 mt-0.5 select-none"
          title="Drag to reorder"
          aria-label="Drag to reorder bullet"
        >
          ⠿
        </span>
      )}
      <span className="text-[#8B0000] mt-0.5 shrink-0">•</span>
      {isEditing ? (
        <span className="flex-1 flex items-start gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 border-b border-dashed border-[#8B0000] bg-transparent outline-none text-xs text-gray-700"
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onClick={onRemove}
            aria-label="Remove bullet"
            className="text-red-400 hover:text-red-600 text-xs shrink-0 mt-0.5 opacity-0 group-hover/bullet:opacity-100"
          >
            −
          </button>
        </span>
      ) : (
        <span className="flex-1 leading-relaxed">{value}</span>
      )}
    </li>
  );
}
