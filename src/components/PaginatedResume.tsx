'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData } from '@/types/resume';
import {
  pageContentHeightMm,
  PAGE_TOTAL_MM,
  PAGE_WIDTH_MM,
  resolvePageMargins,
} from '@/lib/page-layout';
import type { PageMarginsMm } from '@/types/resume';
import PageMarginGuides from '@/components/PageMarginGuides';
import { buildBlockStream } from '@/lib/resume-blocks';
import { packResumeIntoPages, type PageAssignment } from '@/lib/page-packer';
import { normalizeLayoutSettings } from '@/lib/layout-settings';
import ResumeBlockDocument from '@/components/ResumeBlockDocument';
import CoverPageLayout from '@/components/CoverPageLayout';
import ContinuationPageLayout from '@/components/ContinuationPageLayout';

const PAGE_GAP_PX = 40;

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
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageAssignment[]>([]);
  const [isReady, setIsReady] = useState(false);

  const layout = normalizeLayoutSettings(data.layout);
  const pageMargins = useMemo(() => resolvePageMargins(layout), [layout]);
  const contentHeightMm = useMemo(() => pageContentHeightMm(pageMargins), [pageMargins]);
  const blocks = useMemo(() => buildBlockStream(data, layout), [data, layout]);
  const blocksById = useMemo(
    () => new Map(blocks.map((block) => [block.id, block])),
    [blocks]
  );

  const measureAndPack = useCallback(() => {
    const root = measureRef.current;
    if (!root) {
      return;
    }

    const heights = new Map<string, number>();
    root.querySelectorAll<HTMLElement>('[data-resume-block-id]').forEach((element) => {
      const id = element.dataset.resumeBlockId;
      if (!id) {
        return;
      }
      heights.set(id, element.offsetHeight);
    });

    setPages(packResumeIntoPages(data, heights, layout));
  }, [data, layout]);

  useEffect(() => {
    measureAndPack();
    const root = measureRef.current;
    if (!root) {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureAndPack();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [measureAndPack]);

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
      measureAndPack();
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
  }, [data, pages.length, printMode, measureAndPack]);

  const handleSpacerResize = useCallback(
    (controlId: string, heightMm: number) => {
      if (!onChange) return;
      onChange((current) => {
        const currentLayout = normalizeLayoutSettings(current.layout);
        return {
          ...current,
          layout: {
            ...currentLayout,
            controls: currentLayout.controls.map((control) =>
              control.id === controlId ? { ...control, heightMm } : control
            ),
          },
        };
      });
    },
    [onChange]
  );

  const handleMarginsChange = useCallback(
    (margins: PageMarginsMm) => {
      if (!onChange) return;
      onChange((current) => {
        const currentLayout = normalizeLayoutSettings(current.layout);
        return {
          ...current,
          layout: {
            ...currentLayout,
            pageMargins: margins,
          },
        };
      });
    },
    [onChange]
  );

  const pagePadding = `${pageMargins.top}mm ${pageMargins.right}mm ${pageMargins.bottom}mm ${pageMargins.left}mm`;

  return (
    <>
      <div
        aria-hidden="true"
        ref={measureRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: `${PAGE_WIDTH_MM}mm`,
          padding: `0 ${pageMargins.left}mm 0 ${pageMargins.right}mm`,
          fontSize: '13px',
          pointerEvents: 'none',
          visibility: 'hidden',
          color: 'var(--resume-text)',
        }}
      >
        <ResumeBlockDocument
          data={data}
          onChange={onChange}
          hideContactInfo={hideContactInfo}
          onSpacerResize={handleSpacerResize}
        />
      </div>

      <div
        className={printMode ? 'resume-pages-print' : 'resume-pages-preview'}
        data-print-ready={printMode ? String(isReady) : undefined}
      >
        {pages.map((page, pageIndex) => (
          <div key={`page-${pageIndex}`}>
            <div
              className={`resume-page resume-page-shell mx-auto bg-[var(--resume-paper)] text-[var(--resume-text)] ${showShadow ? 'shadow-xl' : ''}`}
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_TOTAL_MM}mm`,
                padding: pagePadding,
                fontSize: '13px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {!printMode && onChange && (
                <PageMarginGuides margins={pageMargins} onMarginsChange={handleMarginsChange} />
              )}
              <div
                className="resume-page-content"
                style={{
                  height: `${contentHeightMm}mm`,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {page.layout === 'cover' && page.cover ? (
                  <CoverPageLayout
                    data={data}
                    cover={page.cover}
                    blocksById={blocksById}
                    onChange={onChange}
                    hideContactInfo={hideContactInfo}
                    onSpacerResize={handleSpacerResize}
                  />
                ) : (
                  <ContinuationPageLayout
                    data={data}
                    blockIds={page.blockIds}
                    blocksById={blocksById}
                    onChange={onChange}
                    hideContactInfo={hideContactInfo}
                    onSpacerResize={handleSpacerResize}
                  />
                )}
              </div>
            </div>
            {showPageGaps && pageIndex < pages.length - 1 && (
              <div
                className="no-print flex items-center justify-center"
                style={{ height: `${PAGE_GAP_PX}px` }}
              >
                <span className="text-xs text-gray-400">
                  Page {pageIndex + 1} of {pages.length}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
