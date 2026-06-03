'use client';

import { useEditMode } from '@/context/EditModeContext';
import BlockShell from '@/components/BlockShell';
import { DEFAULT_SPACER_HEIGHT_MM } from '@/lib/layout-settings';

interface LayoutSpacerProps {
  blockId: string;
  controlId: string;
  heightMm: number;
  onResize?: (heightMm: number) => void;
}

export default function LayoutSpacer({
  blockId,
  controlId,
  heightMm,
  onResize,
}: LayoutSpacerProps) {
  const { isEditing } = useEditMode();

  return (
    <BlockShell blockId={blockId} className="resume-spacer-block group/spacer relative">
      <div
        aria-hidden={!isEditing}
        className={isEditing ? 'resume-spacer-fill border border-dashed border-[#8B000040] bg-[#8B000008]' : ''}
        style={{ height: `${heightMm}mm`, minHeight: `${heightMm}mm` }}
        data-layout-control-id={controlId}
      />
      {isEditing && onResize && (
        <button
          type="button"
          aria-label="Resize spacer"
          className="resume-spacer-handle absolute bottom-0 left-1/2 z-10 flex h-3 w-16 -translate-x-1/2 translate-y-1/2 cursor-ns-resize items-center justify-center rounded-full bg-[#8B0000] text-[9px] text-white opacity-0 transition-opacity group-hover/spacer:opacity-100"
          onMouseDown={(event) => {
            event.preventDefault();
            const startY = event.clientY;
            const startHeight = heightMm;
            const onMove = (moveEvent: MouseEvent) => {
              const deltaMm = (moveEvent.clientY - startY) / (96 / 25.4);
              onResize(Math.max(1, Math.round(startHeight + deltaMm)));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          {heightMm}mm
        </button>
      )}
    </BlockShell>
  );
}

export function LayoutPageBreakMarker({ blockId }: { blockId: string }) {
  const { isEditing } = useEditMode();

  return (
    <BlockShell blockId={blockId} className="resume-page-break-block">
      {isEditing && (
        <div className="my-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#8B0000]">
          <span className="h-px flex-1 bg-[#8B000040]" />
          Page break
          <span className="h-px flex-1 bg-[#8B000040]" />
        </div>
      )}
    </BlockShell>
  );
}
