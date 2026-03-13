'use client';

import type { EducationEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';

interface EducationSectionProps {
  items: EducationEntry[];
  onChange: (items: EducationEntry[]) => void;
}

export default function EducationSection({ items, onChange }: EducationSectionProps) {
  const { isEditing } = useEditMode();

  const updateItem = (i: number, patch: Partial<EducationEntry>) =>
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const addItem = () =>
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        degree: 'Degree / Qualification',
        institution: 'Institution Name',
        period: 'YYYY – YYYY',
      },
    ]);

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <section>
      <h2 className="section-heading">Education</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.id} className="relative group">
            {isEditing && (
              <button
                onClick={() => removeItem(i)}
                aria-label={`Remove education ${item.degree}`}
                className="absolute -right-1 -top-1 z-10 w-5 h-5 flex items-center justify-center bg-red-100 text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
              >
                ×
              </button>
            )}
            <EditableText
              value={item.degree}
              onChange={(v) => updateItem(i, { degree: v })}
              as="h3"
              className="font-semibold text-gray-900 text-sm leading-snug"
            />
            <EditableText
              value={item.institution}
              onChange={(v) => updateItem(i, { institution: v })}
              as="p"
              className="text-xs text-[#8B0000] font-medium"
            />
            <EditableText
              value={item.period}
              onChange={(v) => updateItem(i, { period: v })}
              as="p"
              className="text-xs text-gray-500 mt-0.5"
            />
            {i < items.length - 1 && <hr className="mt-3 border-dashed border-gray-200" />}
          </div>
        ))}
      </div>

      {isEditing && (
        <button
          onClick={addItem}
          className="mt-3 w-full text-sm text-[#8B0000] border border-dashed border-[#8B0000] rounded py-1.5 hover:bg-red-50 transition-colors"
        >
          + Add Education
        </button>
      )}
    </section>
  );
}
