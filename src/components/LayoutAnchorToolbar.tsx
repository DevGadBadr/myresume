'use client';

import { useEditMode } from '@/context/EditModeContext';
import { DEFAULT_SPACER_HEIGHT_MM } from '@/lib/layout-settings';
import { cloneLayoutSettings } from '@/lib/layout-settings';
import type { LayoutAnchor, LayoutControl, ResumeLayoutSettings } from '@/types/resume';

function anchorKey(anchor: LayoutAnchor): string {
  if (anchor.kind === 'afterHeader') {
    return 'afterHeader';
  }
  if (anchor.kind === 'beforeSection' || anchor.kind === 'afterSection') {
    return `${anchor.kind}:${anchor.section}`;
  }
  return `${anchor.kind}:${anchor.section}:${anchor.entryId}`;
}

interface LayoutAnchorToolbarProps {
  anchor: LayoutAnchor;
  layout: ResumeLayoutSettings;
  onLayoutChange: (updater: (layout: ResumeLayoutSettings) => ResumeLayoutSettings) => void;
}

export default function LayoutAnchorToolbar({
  anchor,
  layout,
  onLayoutChange,
}: LayoutAnchorToolbarProps) {
  const { isEditing } = useEditMode();
  if (!isEditing) {
    return null;
  }

  const insertControl = (type: LayoutControl['type']) => {
    onLayoutChange((current) => {
      const next = cloneLayoutSettings(current);
      next.controls = [
        ...next.controls,
        {
          id: crypto.randomUUID(),
          type,
          anchor,
          heightMm: type === 'spacer' ? DEFAULT_SPACER_HEIGHT_MM : undefined,
        },
      ];
      return next;
    });
  };

  const removeAtAnchor = () => {
    const key = anchorKey(anchor);
    onLayoutChange((current) => {
      const next = cloneLayoutSettings(current);
      next.controls = next.controls.filter((control) => anchorKey(control.anchor) !== key);
      return next;
    });
  };

  const hasControls = layout.controls.some((control) => anchorKey(control.anchor) === anchorKey(anchor));

  return (
    <div className="resume-layout-toolbar no-print my-1 flex flex-wrap items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [.resume-block:hover_&]:opacity-100">
      <button
        type="button"
        onClick={() => insertControl('spacer')}
        className="rounded border border-[#8B000030] px-1.5 py-0.5 text-[10px] text-[#8B0000] hover:bg-[#8B000010]"
      >
        + Spacer
      </button>
      <button
        type="button"
        onClick={() => insertControl('pageBreak')}
        className="rounded border border-[#8B000030] px-1.5 py-0.5 text-[10px] text-[#8B0000] hover:bg-[#8B000010]"
      >
        + Page break
      </button>
      {hasControls && (
        <button
          type="button"
          onClick={removeAtAnchor}
          className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50"
        >
          Clear layout here
        </button>
      )}
    </div>
  );
}
