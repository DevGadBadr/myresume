'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageMarginsMm } from '@/types/resume';
import { useEditMode } from '@/context/EditModeContext';
import {
  clampMarginMm,
  MAX_PAGE_MARGIN_MM,
  MIN_PAGE_MARGIN_MM,
  MIN_PAGE_CONTENT_MM,
  PAGE_TOTAL_MM,
  PAGE_WIDTH_MM,
} from '@/lib/page-layout';

const HANDLE_SIZE_PX = 4;

type MarginSide = keyof PageMarginsMm;

interface PageMarginGuidesProps {
  margins: PageMarginsMm;
  onMarginsChange: (margins: PageMarginsMm) => void;
}

function clampMargins(margins: PageMarginsMm): PageMarginsMm {
  const next: PageMarginsMm = {
    top: clampMarginMm(margins.top),
    right: clampMarginMm(margins.right),
    bottom: clampMarginMm(margins.bottom),
    left: clampMarginMm(margins.left),
  };

  const maxVertical = PAGE_TOTAL_MM - MIN_PAGE_CONTENT_MM;
  const maxHorizontal = PAGE_WIDTH_MM - MIN_PAGE_CONTENT_MM;
  if (next.top + next.bottom > maxVertical) {
    const scale = maxVertical / (next.top + next.bottom);
    next.top *= scale;
    next.bottom *= scale;
  }
  if (next.left + next.right > maxHorizontal) {
    const scale = maxHorizontal / (next.left + next.right);
    next.left *= scale;
    next.right *= scale;
  }

  return next;
}

export default function PageMarginGuides({ margins, onMarginsChange }: PageMarginGuidesProps) {
  const { isEditing } = useEditMode();
  const shellRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PageMarginsMm | null>(null);
  const active = preview ?? margins;

  useEffect(() => {
    setPreview(null);
  }, [margins]);

  const startDrag = useCallback(
    (side: MarginSide) => (event: React.MouseEvent) => {
      event.preventDefault();
      const shell = shellRef.current?.parentElement;
      if (!shell) {
        return;
      }

      const startX = event.clientX;
      const startY = event.clientY;
      const startMargins = { ...margins };
      const shellWidthPx = shell.offsetWidth;
      const shellHeightPx = shell.offsetHeight;
      const pxPerMmX = shellWidthPx / PAGE_WIDTH_MM;
      const pxPerMmY = shellHeightPx / PAGE_TOTAL_MM;

      const onMove = (moveEvent: MouseEvent) => {
        const deltaXmm = (moveEvent.clientX - startX) / pxPerMmX;
        const deltaYmm = (moveEvent.clientY - startY) / pxPerMmY;
        const next = { ...startMargins };

        switch (side) {
          case 'left':
            next.left = clampMarginMm(startMargins.left + deltaXmm);
            break;
          case 'right':
            next.right = clampMarginMm(startMargins.right - deltaXmm);
            break;
          case 'top':
            next.top = clampMarginMm(startMargins.top + deltaYmm);
            break;
          case 'bottom':
            next.bottom = clampMarginMm(startMargins.bottom - deltaYmm);
            break;
        }

        setPreview(clampMargins(next));
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        setPreview((current) => {
          if (current) {
            onMarginsChange(current);
          }
          return null;
        });
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [margins, onMarginsChange]
  );

  if (!isEditing) {
    return null;
  }

  const labels: Record<MarginSide, string> = {
    top: 'Top page margin',
    right: 'Right page margin',
    bottom: 'Bottom page margin',
    left: 'Left page margin',
  };

  return (
    <div ref={shellRef} className="no-print pointer-events-none absolute inset-0 z-20">
      <div
        className="pointer-events-auto absolute left-0 right-0 cursor-ns-resize border-t border-dashed"
        style={{
          top: `${active.top}mm`,
          height: HANDLE_SIZE_PX,
          marginTop: -HANDLE_SIZE_PX / 2,
          borderColor: 'color-mix(in srgb, var(--resume-accent) 45%, transparent)',
        }}
        role="separator"
        aria-label={labels.top}
        aria-valuemin={MIN_PAGE_MARGIN_MM}
        aria-valuemax={MAX_PAGE_MARGIN_MM}
        aria-valuenow={Math.round(active.top)}
        onMouseDown={startDrag('top')}
      />
      <div
        className="pointer-events-auto absolute top-0 bottom-0 cursor-ew-resize border-r border-dashed"
        style={{
          right: `${active.right}mm`,
          width: HANDLE_SIZE_PX,
          marginRight: -HANDLE_SIZE_PX / 2,
          borderColor: 'color-mix(in srgb, var(--resume-accent) 45%, transparent)',
        }}
        role="separator"
        aria-label={labels.right}
        aria-valuemin={MIN_PAGE_MARGIN_MM}
        aria-valuemax={MAX_PAGE_MARGIN_MM}
        aria-valuenow={Math.round(active.right)}
        onMouseDown={startDrag('right')}
      />
      <div
        className="pointer-events-auto absolute left-0 right-0 cursor-ns-resize border-t border-dashed"
        style={{
          bottom: `${active.bottom}mm`,
          height: HANDLE_SIZE_PX,
          marginBottom: -HANDLE_SIZE_PX / 2,
          borderColor: 'color-mix(in srgb, var(--resume-accent) 45%, transparent)',
        }}
        role="separator"
        aria-label={labels.bottom}
        aria-valuemin={MIN_PAGE_MARGIN_MM}
        aria-valuemax={MAX_PAGE_MARGIN_MM}
        aria-valuenow={Math.round(active.bottom)}
        onMouseDown={startDrag('bottom')}
      />
      <div
        className="pointer-events-auto absolute top-0 bottom-0 cursor-ew-resize border-l border-dashed"
        style={{
          left: `${active.left}mm`,
          width: HANDLE_SIZE_PX,
          marginLeft: -HANDLE_SIZE_PX / 2,
          borderColor: 'color-mix(in srgb, var(--resume-accent) 45%, transparent)',
        }}
        role="separator"
        aria-label={labels.left}
        aria-valuemin={MIN_PAGE_MARGIN_MM}
        aria-valuemax={MAX_PAGE_MARGIN_MM}
        aria-valuenow={Math.round(active.left)}
        onMouseDown={startDrag('left')}
      />
    </div>
  );
}
