'use client';

import type { CertEntry } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';

interface CertificatesSectionProps {
  items: CertEntry[];
  onChange: (items: CertEntry[]) => void;
}

export default function CertificatesSection({ items, onChange }: CertificatesSectionProps) {
  const { isEditing } = useEditMode();

  const updateItem = (i: number, patch: Partial<CertEntry>) =>
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

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
      <h2 className="section-heading">Certificates</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.id} className="relative group">
            {isEditing && (
              <button
                onClick={() => removeItem(i)}
                aria-label={`Remove certificate ${item.title}`}
                className="absolute -right-1 -top-1 z-10 w-5 h-5 flex items-center justify-center bg-red-100 text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
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
              value={item.issuer}
              onChange={(v) => updateItem(i, { issuer: v })}
              as="p"
              className="text-xs text-[#8B0000] font-medium"
            />
            <EditableText
              value={item.date}
              onChange={(v) => updateItem(i, { date: v })}
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
          + Add Certificate
        </button>
      )}
    </section>
  );
}
