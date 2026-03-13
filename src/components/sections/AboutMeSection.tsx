'use client';

import { useEditMode } from '@/context/EditModeContext';

interface AboutMeSectionProps {
  text: string;
  onChange: (text: string) => void;
}

export default function AboutMeSection({ text, onChange }: AboutMeSectionProps) {
  const { isEditing } = useEditMode();

  return (
    <section>
      <h2 className="section-heading">About Me</h2>
      <div className="bg-[#fdf5f5] border-l-4 border-[#8B0000] pl-3 py-2 rounded-r">
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            className="w-full bg-transparent border-b border-dashed border-[#8B0000] outline-none text-sm text-gray-700 italic leading-relaxed resize-none"
            style={{ fontFamily: 'inherit' }}
          />
        ) : (
          <p className="text-sm text-gray-700 italic leading-relaxed">
            &ldquo;{text}&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}
