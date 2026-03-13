'use client';

import { useEditMode } from '@/context/EditModeContext';

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div';
  multiline?: boolean;
  placeholder?: string;
}

export default function EditableText({
  value,
  onChange,
  className = '',
  as: Tag = 'span',
  multiline = false,
  placeholder = 'Click to edit...',
}: EditableTextProps) {
  const { isEditing } = useEditMode();

  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>;
  }

  const editClass = `${className} border-b border-dashed border-[#8B0000] bg-transparent outline-none focus:border-solid w-full resize-none`;

  if (multiline) {
    return (
      <textarea
        className={editClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
    );
  }

  return (
    <input
      type="text"
      className={editClass}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
    />
  );
}
