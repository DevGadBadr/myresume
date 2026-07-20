'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData, ResumeLayoutId } from '@/types/resume';
import {
  pageContentHeightMm,
  PAGE_TOTAL_MM,
  PAGE_WIDTH_MM,
  resolvePageMargins,
} from '@/lib/page-layout';
import { normalizeLayoutSettings } from '@/lib/layout-settings';
import { getLayoutDefinition, normalizeLayoutId } from '@/layouts';
import { useEditMode } from '@/context/EditModeContext';
import { EditModeContext } from '@/context/EditModeContext';
import ResumeDocumentBody from '@/components/ResumeDocumentBody';

const MM_TO_PX = 96 / 25.4;
/** Visual gap between Word-like page sheets (screen only). */
const PAGE_GAP_PX = 32;

interface ResumeFlowDocumentProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  showPageGaps?: boolean;
  showShadow?: boolean;
  printMode?: boolean;
  hideContactInfo?: boolean;
  /** Override layout (e.g. from active template). */
  layoutId?: ResumeLayoutId;
}

export default function ResumeFlowDocument({
  data,
  onChange,
  showShadow = false,
  printMode = false,
  hideContactInfo = false,
  layoutId,
}: ResumeFlowDocumentProps) {
  const { isEditing, toggle } = useEditMode();
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [livePageIndex, setLivePageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const resolvedLayoutId = normalizeLayoutId(layoutId ?? data.layoutId);
  const layoutDef = useMemo(() => getLayoutDefinition(resolvedLayoutId), [resolvedLayoutId]);
  const layoutSettings = normalizeLayoutSettings(data.layout);
  const pageMargins = useMemo(() => resolvePageMargins(layoutSettings), [layoutSettings]);
  const contentHeightMm = useMemo(() => pageContentHeightMm(pageMargins), [pageMargins]);

  const paperStyle: React.CSSProperties = useMemo(
    () => ({
      width: `${PAGE_WIDTH_MM}mm`,
      minHeight: `${PAGE_TOTAL_MM}mm`,
      paddingTop: `${pageMargins.top}mm`,
      paddingRight: `${pageMargins.right}mm`,
      paddingBottom: `${pageMargins.bottom}mm`,
      paddingLeft: `${pageMargins.left}mm`,
      boxSizing: 'border-box' as const,
    }),
    [pageMargins]
  );

  const measurePages = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;

    const contentHeightPx = root.scrollHeight;
    const pageHeightPx = PAGE_TOTAL_MM * MM_TO_PX;
    const nextCount = Math.max(1, Math.ceil(contentHeightPx / pageHeightPx - 0.001));
    setPageCount(nextCount);
  }, []);

  useEffect(() => {
    measurePages();
    const root = measureRef.current;
    if (!root) return;

    const observer = new ResizeObserver(() => measurePages());
    observer.observe(root);
    return () => observer.disconnect();
  }, [measurePages, data, resolvedLayoutId, isEditing]);

  useEffect(() => {
    setLivePageIndex((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    if (!printMode) {
      setIsReady(true);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    document.body.dataset.printReady = 'false';

    const waitForLayout = async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      measurePages();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (cancelled) return;
      setIsReady(true);
      document.body.dataset.printReady = 'true';
    };

    void waitForLayout();
    return () => {
      cancelled = true;
    };
  }, [printMode, measurePages, data, resolvedLayoutId]);

  if (printMode) {
    return (
      <div
        className={`resume-flow-print ${isReady ? 'is-ready' : ''}`}
        style={{ width: `${PAGE_WIDTH_MM}mm`, margin: '0 auto' }}
      >
        <div ref={measureRef} className="resume-flow-print-content bg-white" style={paperStyle}>
          <ResumeDocumentBody
            data={data}
            layout={layoutDef}
            onChange={onChange}
            hideContactInfo={hideContactInfo}
          />
        </div>
      </div>
    );
  }

  const pages = Array.from({ length: pageCount }, (_, index) => index);

  return (
    <div className="resume-flow-screen mx-auto" style={{ width: `${PAGE_WIDTH_MM}mm` }}>
      {/* Off-screen measure: full continuous document height */}
      <div
        className="pointer-events-none absolute left-0 top-0 -z-10 w-[210mm] opacity-0"
        aria-hidden
        style={{ position: 'absolute', left: -10000, top: 0 }}
      >
        <div ref={measureRef} style={paperStyle}>
          <EditModeContext.Provider value={{ isEditing: false, toggle }}>
            <ResumeDocumentBody data={data} layout={layoutDef} hideContactInfo={hideContactInfo} />
          </EditModeContext.Provider>
        </div>
      </div>

      <div className="resume-word-stack flex flex-col items-center">
        {pages.map((pageIndex) => {
          const isLiveSheet = isEditing && pageIndex === livePageIndex;

          return (
            <div
              key={pageIndex}
              className={`resume-word-page relative bg-[var(--resume-paper)] ${
                showShadow
                  ? 'shadow-[0_1px_2px_rgba(0,0,0,0.07),0_10px_28px_rgba(0,0,0,0.14)]'
                  : 'border border-[var(--resume-border)]'
              } ${isLiveSheet ? 'ring-1 ring-[var(--resume-accent-border)]' : ''}`}
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_TOTAL_MM}mm`,
                overflow: 'hidden',
                marginBottom: pageIndex < pageCount - 1 ? PAGE_GAP_PX : 0,
                boxSizing: 'border-box',
              }}
              onMouseDownCapture={() => {
                if (isEditing) setLivePageIndex(pageIndex);
              }}
            >
              <div
                className="resume-word-page-shift"
                style={{
                  transform: `translate3d(0, -${pageIndex * PAGE_TOTAL_MM}mm, 0)`,
                }}
              >
                {isLiveSheet ? (
                  <div style={paperStyle}>
                    <ResumeDocumentBody
                      data={data}
                      layout={layoutDef}
                      onChange={onChange}
                      hideContactInfo={hideContactInfo}
                    />
                  </div>
                ) : (
                  <EditModeContext.Provider value={{ isEditing: false, toggle }}>
                    <div
                      className={isEditing ? 'pointer-events-none select-none' : undefined}
                      style={paperStyle}
                      aria-hidden={isEditing || undefined}
                    >
                      <ResumeDocumentBody
                        data={data}
                        layout={layoutDef}
                        onChange={isEditing ? undefined : onChange}
                        hideContactInfo={hideContactInfo}
                      />
                    </div>
                  </EditModeContext.Provider>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end px-3 pb-2 no-print">
                <span className="rounded bg-[var(--resume-paper)]/90 px-1.5 text-[9px] tabular-nums text-[var(--resume-subtle)]">
                  {pageIndex + 1} / {pageCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="no-print mt-3 text-center text-[10px] text-[var(--resume-subtle)]">
        {pageCount} page{pageCount === 1 ? '' : 's'}
        {isEditing ? ' · click a page to edit that sheet' : ''} · {contentHeightMm.toFixed(0)}
        mm printable area
      </p>
    </div>
  );
}
