'use client';

import type { EducationEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';

interface EducationSectionProps {
  items: EducationEntry[];
  onChange: (items: EducationEntry[]) => void;
  onlyEntryIds?: string[];
  showHeading?: boolean;
  showListActions?: boolean;
}

export default function EducationSection({
  items,
  onChange,
  onlyEntryIds,
  showHeading = true,
  showListActions = true,
}: EducationSectionProps) {
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
  const visibleItems = onlyEntryIds
    ? items.filter((item) => onlyEntryIds.includes(item.id))
    : items;

  return (
    <section>
      {showHeading && <h2 className="section-heading">Education</h2>}
      <div className="space-y-3">
        {visibleItems.map((item, i) => {
          const sourceIndex = items.findIndex((entry) => entry.id === item.id);
          return (
          <div
            key={item.id}
            className={`resume-entry relative group ${item.pageBreakBefore ? 'resume-page-break-before' : ''}`}
          >
            {isEditing && showListActions && (
              <div className="mb-1 flex items-center justify-end gap-2 no-print">
                <label className="flex items-center gap-1 text-[10px] text-gray-400">
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
                <button
                  type="button"
                  onClick={() => removeItem(sourceIndex)}
                  aria-label={`Remove education ${item.degree}`}
                  className="z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-500 opacity-0 transition-opacity hover:bg-red-200 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            )}
            <EditableText
              value={item.degree}
              onChange={(v) => updateItem(sourceIndex, { degree: v })}
              as="h3"
              className="font-semibold text-gray-900 text-sm leading-snug"
            />
            <EditableText
              value={item.institution}
              onChange={(v) => updateItem(sourceIndex, { institution: v })}
              as="p"
              className="text-xs text-[#8B0000] font-medium"
            />
            <EditableText
              value={item.period}
              onChange={(v) => updateItem(sourceIndex, { period: v })}
              as="p"
              className="text-xs text-gray-500 mt-0.5"
            />
            {i < visibleItems.length - 1 && <hr className="mt-3 border-dashed border-gray-200" />}
          </div>
          );
        })}
      </div>

      {isEditing && showListActions && !onlyEntryIds && (
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
