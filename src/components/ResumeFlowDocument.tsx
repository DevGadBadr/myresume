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
import ResumeDocumentBody from '@/components/ResumeDocumentBody';

const MM_TO_PX = 96 / 25.4;

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [isReady, setIsReady] = useState(false);

  const resolvedLayoutId = normalizeLayoutId(layoutId ?? data.layoutId);
  const layoutDef = useMemo(() => getLayoutDefinition(resolvedLayoutId), [resolvedLayoutId]);
  const layoutSettings = normalizeLayoutSettings(data.layout);
  const pageMargins = useMemo(() => resolvePageMargins(layoutSettings), [layoutSettings]);
  const contentHeightMm = useMemo(() => pageContentHeightMm(pageMargins), [pageMargins]);

  const measurePages = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;

    const contentHeightPx = root.scrollHeight;
    const pageHeightPx = PAGE_TOTAL_MM * MM_TO_PX;
    const nextCount = Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
    setPageCount(nextCount);
  }, []);

  useEffect(() => {
    measurePages();
    const root = contentRef.current;
    if (!root) return;

    const observer = new ResizeObserver(() => measurePages());
    observer.observe(root);
    return () => observer.disconnect();
  }, [measurePages, data, resolvedLayoutId]);

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

  const paperStyle: React.CSSProperties = {
    width: `${PAGE_WIDTH_MM}mm`,
    minHeight: `${PAGE_TOTAL_MM}mm`,
    paddingTop: `${pageMargins.top}mm`,
    paddingRight: `${pageMargins.right}mm`,
    paddingBottom: `${pageMargins.bottom}mm`,
    paddingLeft: `${pageMargins.left}mm`,
    boxSizing: 'border-box',
  };

  if (printMode) {
    return (
      <div
        className={`resume-flow-print ${isReady ? 'is-ready' : ''}`}
        style={{ width: `${PAGE_WIDTH_MM}mm`, margin: '0 auto' }}
      >
        <div ref={contentRef} className="resume-flow-print-content bg-white" style={paperStyle}>
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

  return (
    <div className="resume-flow-screen relative mx-auto" style={{ width: `${PAGE_WIDTH_MM}mm` }}>
      <div
        ref={contentRef}
        className={`resume-flow-screen-content relative bg-[var(--resume-paper)] ${
          showShadow ? 'shadow-lg' : 'border border-[var(--resume-border)]'
        }`}
        style={{
          ...paperStyle,
          minHeight: `${Math.max(pageCount, 1) * PAGE_TOTAL_MM}mm`,
        }}
      >
        <ResumeDocumentBody
          data={data}
          layout={layoutDef}
          onChange={onChange}
          hideContactInfo={hideContactInfo}
        />
      </div>

      {/* Visual A4 page boundaries */}
      {pageCount > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 no-print" aria-hidden>
          {Array.from({ length: pageCount - 1 }, (_, index) => (
            <div
              key={index}
              className="absolute left-0 right-0 border-t-2 border-dashed border-[var(--resume-accent-border)]"
              style={{ top: `${(index + 1) * PAGE_TOTAL_MM}mm` }}
            >
              <span className="absolute -top-2.5 right-2 rounded bg-[var(--resume-panel)] px-1.5 text-[9px] uppercase tracking-wider text-[var(--resume-subtle)]">
                Page {index + 2}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="no-print mt-2 text-center text-[10px] text-[var(--resume-subtle)]">
        {pageCount} page{pageCount === 1 ? '' : 's'} · {contentHeightMm.toFixed(0)}mm content height
        per page
      </p>
    </div>
  );
}
