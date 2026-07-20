'use client';

import { useEditMode } from '@/context/EditModeContext';
import WordLikeText from '@/components/editor/WordLikeText';

interface AboutMeSectionProps {
  text: string;
  onChange: (text: string) => void;
  showHeading?: boolean;
}

export default function AboutMeSection({
  text,
  onChange,
  showHeading = true,
}: AboutMeSectionProps) {
  const { isEditing } = useEditMode();

  return (
    <section>
      {showHeading && <h2 className="section-heading">About Me</h2>}
      <div className="bg-[#fdf5f5] border-l-4 border-[#8B0000] pl-3 py-2 rounded-r">
        {isEditing ? (
          <WordLikeText
            value={text}
            onChange={onChange}
            className="text-sm text-gray-700 italic leading-relaxed"
            placeholder="Write a short professional summary… (Enter for new line)"
          />
        ) : (
          <p className="text-sm text-gray-700 italic leading-relaxed whitespace-pre-wrap">
            &ldquo;{text}&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}
