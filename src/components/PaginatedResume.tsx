'use client';

import { useEffect, useRef, useState } from 'react';
import type { ResumeData } from '@/types/resume';
import {
  PAGE_CONTENT_MM,
  PAGE_MARGIN_MM,
  PAGE_TOTAL_MM,
  PAGE_WIDTH_MM,
} from '@/lib/page-layout';
import ResumeDocument from '@/components/ResumeDocument';

const MM_TO_PX = 96 / 25.4;
const PAGE_CONTENT_PX = PAGE_CONTENT_MM * MM_TO_PX;
const PAGE_GAP_PX = 40;
const PAGE_OVERFLOW_TOLERANCE_PX = 1;

interface PaginatedResumeProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  showPageGaps?: boolean;
  showShadow?: boolean;
  printMode?: boolean;
  hideContactInfo?: boolean;
}

export default function PaginatedResume({
  data,
  onChange,
  showPageGaps = false,
  showShadow = false,
  printMode = false,
  hideContactInfo = false,
}: PaginatedResumeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      return;
    }

    const update = () => {
      const height = el.scrollHeight;
      // Ignore sub-pixel overflow so integer scrollHeight rounding does not add a blank page.
      const adjustedHeight = Math.max(0, height - PAGE_OVERFLOW_TOLERANCE_PX);
      setPageCount(Math.max(1, Math.ceil(adjustedHeight / PAGE_CONTENT_PX)));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  useEffect(() => {
    if (!printMode) {
      return;
    }

    let cancelled = false;
    setIsReady(false);
    document.body.dataset.printReady = 'false';

    const waitForLayout = async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (cancelled) {
        return;
      }

      setIsReady(true);
      document.body.dataset.printReady = 'true';
    };

    void waitForLayout();

    return () => {
      cancelled = true;
      document.body.dataset.printReady = 'false';
    };
  }, [data, pageCount, printMode]);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: `${PAGE_WIDTH_MM}mm`,
          padding: `0 ${PAGE_MARGIN_MM}mm`,
          fontSize: '13px',
          pointerEvents: 'none',
          visibility: 'hidden',
          color: 'var(--resume-text)',
        }}
      >
        <div ref={contentRef}>
          <ResumeDocument data={data} onChange={onChange} hideContactInfo={hideContactInfo} />
        </div>
      </div>

      <div
        className={printMode ? 'resume-pages-print' : 'resume-pages-preview'}
        data-print-ready={printMode ? String(isReady) : undefined}
      >
        {Array.from({ length: pageCount }, (_, pageIndex) => (
          <div key={pageIndex}>
            <div
              className={`resume-page mx-auto bg-[var(--resume-paper)] text-[var(--resume-text)] ${showShadow ? 'shadow-xl' : ''}`}
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_TOTAL_MM}mm`,
                padding: `${PAGE_MARGIN_MM}mm`,
                fontSize: '13px',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: `${PAGE_CONTENT_MM}mm`, overflow: 'hidden' }}>
                <div style={{ transform: `translateY(-${pageIndex * PAGE_CONTENT_MM}mm)` }}>
                  <ResumeDocument data={data} onChange={onChange} hideContactInfo={hideContactInfo} />
                </div>
              </div>
            </div>
            {showPageGaps && pageIndex < pageCount - 1 && (
              <div
                className="no-print flex items-center justify-center"
                style={{ height: `${PAGE_GAP_PX}px` }}
              >
                <span className="text-xs text-gray-400">
                  Page {pageIndex + 1} of {pageCount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
