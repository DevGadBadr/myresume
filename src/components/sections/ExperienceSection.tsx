'use client';

import type { ExperienceEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';
import WordLikeBulletList from '@/components/editor/WordLikeBulletList';

interface ExperienceSectionProps {
  items: ExperienceEntry[];
  onChange: (items: ExperienceEntry[]) => void;
  onlyEntryIds?: string[];
  showHeading?: boolean;
  showListActions?: boolean;
}

export default function ExperienceSection({
  items,
  onChange,
  onlyEntryIds,
  showHeading = true,
  showListActions = true,
}: ExperienceSectionProps) {
  const { isEditing } = useEditMode();

  const updateItem = (i: number, patch: Partial<ExperienceEntry>) => {
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
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

  const visibleItems = onlyEntryIds
    ? items.filter((item) => onlyEntryIds.includes(item.id))
    : items;

  return (
    <section>
      {showHeading && <h2 className="section-heading">Experience</h2>}
      <div className="space-y-5">
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
                    aria-label={`Remove experience ${item.role}`}
                    className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs text-red-500 opacity-0 transition-opacity hover:bg-red-200 group-hover:opacity-100"
                    title="Remove entry"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-0.5">
                <div className="flex-1 min-w-0">
                  <EditableText
                    value={item.role}
                    onChange={(v) => updateItem(sourceIndex, { role: v })}
                    as="h3"
                    className="font-semibold text-gray-900 text-sm"
                  />
                  <EditableText
                    value={item.roleSubtitle}
                    onChange={(v) => updateItem(sourceIndex, { roleSubtitle: v })}
                    as="p"
                    className="text-xs text-[#8B0000] font-medium"
                  />
                </div>
                <div className="text-right shrink-0">
                  <EditableText
                    value={item.period}
                    onChange={(v) => updateItem(sourceIndex, { period: v })}
                    as="p"
                    className="text-xs text-gray-500"
                    placeholder="Date range"
                  />
                  <EditableText
                    value={item.company}
                    onChange={(v) => updateItem(sourceIndex, { company: v })}
                    as="p"
                    className="text-xs font-semibold text-gray-700"
                    placeholder="Company"
                  />
                </div>
              </div>

              {isEditing ? (
                <WordLikeBulletList
                  bullets={item.bullets}
                  onChange={(bullets) => updateItem(sourceIndex, { bullets })}
                />
              ) : (
                <ul className="mt-1.5 space-y-1 pl-3">
                  {item.bullets.map((bullet, bi) => (
                    <li key={bi} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-[#8B0000] mt-0.5 shrink-0">•</span>
                      <span className="flex-1 leading-relaxed whitespace-pre-wrap">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {i < visibleItems.length - 1 && <hr className="mt-4 border-dashed border-gray-200" />}
            </div>
          );
        })}
      </div>

      {isEditing && showListActions && (
        <button
          type="button"
          onClick={addItem}
          className="mt-4 w-full text-sm text-[#8B0000] border border-dashed border-[#8B0000] rounded py-1.5 hover:bg-red-50 transition-colors no-print"
        >
          + Add Experience
        </button>
      )}
    </section>
  );
}
