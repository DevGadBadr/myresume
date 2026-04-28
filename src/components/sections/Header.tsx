'use client';

import type { ContactLink, PersonalInfo } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import EditableText from '@/components/EditableText';

interface HeaderProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
  hideContactInfo?: boolean;
}

export default function Header({ data, onChange, hideContactInfo = false }: HeaderProps) {
  const { isEditing } = useEditMode();

  const updateField = <K extends keyof PersonalInfo>(key: K, val: PersonalInfo[K]) =>
    onChange({ ...data, [key]: val });

  const updatePhone = (i: number, val: string) => {
    const phones = [...data.phones];
    phones[i] = val;
    updateField('phones', phones);
  };

  const addPhone = () => updateField('phones', [...data.phones, '']);
  const removePhone = (i: number) =>
    updateField('phones', data.phones.filter((_, idx) => idx !== i));

  const updateLink = (i: number, key: keyof ContactLink, val: string) => {
    const links = data.links.map((l, idx) => (idx === i ? { ...l, [key]: val } : l));
    updateField('links', links);
  };

  const addLink = () =>
    updateField('links', [...data.links, { label: 'Link', url: 'https://' }]);

  const removeLink = (i: number) =>
    updateField('links', data.links.filter((_, idx) => idx !== i));

  return (
    <header className="border-b-2 border-[#8B0000] pb-4 mb-6">
      {/* Name */}
      <EditableText
        value={data.name}
        onChange={(v) => updateField('name', v)}
        as="h1"
        className="text-4xl font-black tracking-wide text-gray-900 leading-tight"
      />

      {/* Title */}
      <EditableText
        value={data.title}
        onChange={(v) => updateField('title', v)}
        as="p"
        className="text-sm font-bold tracking-[0.25em] text-[#8B0000] uppercase mt-1"
      />

      {/* Contact row */}
      {!hideContactInfo && (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-600">
        {/* Email */}
        <span className="flex items-center gap-1">
          <span className="text-[#8B0000]">✉</span>
          <EditableText
            value={data.email}
            onChange={(v) => updateField('email', v)}
            className="text-gray-700"
          />
        </span>

        {/* Location */}
        <span className="flex items-center gap-1">
          <span className="text-[#8B0000]">⊙</span>
          <EditableText
            value={data.location}
            onChange={(v) => updateField('location', v)}
            className="text-gray-700"
          />
        </span>

        {/* Phones */}
        {data.phones.map((phone, i) => (
          <span key={i} className="flex items-center gap-1 group">
            <span className="text-[#8B0000]">✆</span>
            <EditableText
              value={phone}
              onChange={(v) => updatePhone(i, v)}
              className="text-gray-700"
            />
            {isEditing && (
              <button
                onClick={() => removePhone(i)}
                aria-label={`Remove phone ${i + 1}`}
                className="ml-1 text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {isEditing && (
          <button
            onClick={addPhone}
            className="text-xs text-[#8B0000] border border-dashed border-[#8B0000] px-2 py-0.5 rounded hover:bg-red-50"
          >
            + Phone
          </button>
        )}

        {/* Links */}
        {data.links.map((link, i) => (
          <span key={i} className="flex items-center gap-1 group">
            <span className="text-[#8B0000]">⌘</span>
            {isEditing ? (
              <span className="flex items-center gap-1">
                <EditableText
                  value={link.label}
                  onChange={(v) => updateLink(i, 'label', v)}
                  className="text-[#8B0000] font-medium w-20"
                  placeholder="Label"
                />
                <span className="text-gray-400">:</span>
                <EditableText
                  value={link.url}
                  onChange={(v) => updateLink(i, 'url', v)}
                  className="text-gray-600 w-48"
                  placeholder="URL"
                />
                <button
                  onClick={() => removeLink(i)}
                  aria-label={`Remove link ${link.label || i + 1}`}
                  className="ml-1 text-red-400 hover:text-red-600 text-xs"
                >
                  ×
                </button>
              </span>
            ) : (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#8B0000] font-medium hover:underline"
              >
                {link.label}
              </a>
            )}
          </span>
        ))}

        {isEditing && (
          <button
            onClick={addLink}
            className="text-xs text-[#8B0000] border border-dashed border-[#8B0000] px-2 py-0.5 rounded hover:bg-red-50"
          >
            + Link
          </button>
        )}
      </div>
      )}
    </header>
  );
}
