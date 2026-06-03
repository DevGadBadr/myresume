'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData } from '@/types/resume';
import {
  PAGE_CONTENT_MM,
  PAGE_MARGIN_MM,
  PAGE_TOTAL_MM,
  PAGE_WIDTH_MM,
} from '@/lib/page-layout';
import { buildBlockStream, type ResumeBlock } from '@/lib/resume-blocks';
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
  showPageGuides?: boolean;
  showSectionGuides?: boolean;
}

export default function PaginatedResume({
  data,
  onChange,
  showPageGaps = false,
  showShadow = false,
  printMode = false,
  hideContactInfo = false,
  showPageGuides = false,
  showSectionGuides = false,
}: PaginatedResumeProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageAssignment[]>([]);
  const [isReady, setIsReady] = useState(false);

  const layout = normalizeLayoutSettings(data.layout);
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

  const guideClass = [
    showPageGuides ? 'show-page-guides' : '',
    showSectionGuides ? 'show-section-guides' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
          padding: `0 ${PAGE_MARGIN_MM}mm`,
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
        className={`${printMode ? 'resume-pages-print' : 'resume-pages-preview'} ${guideClass}`.trim()}
        data-print-ready={printMode ? String(isReady) : undefined}
      >
        {pages.map((page, pageIndex) => (
          <div key={`page-${pageIndex}`}>
            <div
              className={`resume-page resume-page-shell mx-auto bg-[var(--resume-paper)] text-[var(--resume-text)] ${showShadow ? 'shadow-xl' : ''}`}
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_TOTAL_MM}mm`,
                padding: `${PAGE_MARGIN_MM}mm`,
                fontSize: '13px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                className="resume-page-content"
                style={{
                  height: `${PAGE_CONTENT_MM}mm`,
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
