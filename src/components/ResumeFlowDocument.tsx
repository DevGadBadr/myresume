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
import { buildFlowBlocks, type FlowBlock } from '@/lib/flow-blocks';
import { packFlowBlocks, type PackedPage } from '@/lib/flow-packer';
import FlowBlockRenderer from '@/components/FlowBlockRenderer';

const MM_TO_PX = 96 / 25.4;
const PAGE_GAP_PX = 32;

interface ResumeFlowDocumentProps {
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  showPageGaps?: boolean;
  showShadow?: boolean;
  printMode?: boolean;
  hideContactInfo?: boolean;
  layoutId?: ResumeLayoutId;
}

function FlowBlockList({
  blocks,
  data,
  onChange,
  hideContactInfo,
  withMeasureIds,
}: {
  blocks: FlowBlock[];
  data: ResumeData;
  onChange?: React.Dispatch<React.SetStateAction<ResumeData>>;
  hideContactInfo?: boolean;
  withMeasureIds?: boolean;
}) {
  return (
    <div className="resume-flow-stack">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="resume-flow-block"
          data-flow-block-id={withMeasureIds ? block.id : undefined}
        >
          <FlowBlockRenderer
            block={block}
            data={data}
            onChange={onChange}
            hideContactInfo={hideContactInfo}
          />
        </div>
      ))}
    </div>
  );
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
  const [pages, setPages] = useState<PackedPage[]>([{ blockIds: [] }]);
  const [isReady, setIsReady] = useState(false);
  /** Bumps after a print-mode measure so we only mark ready once packed pages are painted. */
  const [printPackGeneration, setPrintPackGeneration] = useState(0);

  const resolvedLayoutId = normalizeLayoutId(layoutId ?? data.layoutId);
  const layoutDef = useMemo(() => getLayoutDefinition(resolvedLayoutId), [resolvedLayoutId]);
  const layoutSettings = normalizeLayoutSettings(data.layout);
  const pageMargins = useMemo(() => resolvePageMargins(layoutSettings), [layoutSettings]);
  const contentHeightMm = useMemo(() => pageContentHeightMm(pageMargins), [pageMargins]);

  const blocks = useMemo(() => buildFlowBlocks(data, layoutDef), [data, layoutDef]);
  const blocksById = useMemo(() => new Map(blocks.map((block) => [block.id, block])), [blocks]);

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

  const measureAndPack = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;

    const heights = new Map<string, number>();
    root.querySelectorAll<HTMLElement>('[data-flow-block-id]').forEach((element) => {
      const id = element.dataset.flowBlockId;
      if (!id) return;
      heights.set(id, element.offsetHeight);
    });

    const stack = root.querySelector('.resume-flow-stack');
    const gapPx = stack
      ? Number.parseFloat(window.getComputedStyle(stack).rowGap || window.getComputedStyle(stack).gap) || 0
      : 0;

    const contentHeightPx = contentHeightMm * MM_TO_PX;
    setPages(packFlowBlocks(blocks, heights, contentHeightPx, { gapPx }));
  }, [blocks, contentHeightMm]);

  useEffect(() => {
    measureAndPack();
    const root = measureRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => measureAndPack());
    observer.observe(root);
    return () => observer.disconnect();
  }, [measureAndPack, data, resolvedLayoutId, isEditing]);

  useEffect(() => {
    if (!printMode) {
      setIsReady(true);
      document.body.classList.remove('resume-print-export');
      delete document.body.dataset.printReady;
      delete document.body.dataset.printPageCount;
      return;
    }

    let cancelled = false;
    setIsReady(false);
    document.body.classList.add('resume-print-export');
    document.body.dataset.printReady = 'false';
    delete document.body.dataset.printPageCount;

    const waitForLayout = async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled) return;
      measureAndPack();
      setPrintPackGeneration((generation) => generation + 1);
    };

    void waitForLayout();
    return () => {
      cancelled = true;
      document.body.classList.remove('resume-print-export');
    };
  }, [printMode, measureAndPack, data, resolvedLayoutId]);

  useEffect(() => {
    if (!printMode || printPackGeneration === 0) {
      return;
    }

    let cancelled = false;

    const markReadyAfterPaint = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled) return;

      const painted = document.querySelectorAll('.resume-print-page').length;
      if (painted !== pages.length) {
        // React commit may still be pending; retry on next frames.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      if (cancelled) return;

      document.body.dataset.printPageCount = String(pages.length);
      setIsReady(true);
      document.body.dataset.printReady = 'true';
    };

    void markReadyAfterPaint();
    return () => {
      cancelled = true;
    };
  }, [printMode, printPackGeneration, pages]);

  const pageBlocks = (page: PackedPage) =>
    page.blockIds
      .map((id) => blocksById.get(id))
      .filter((block): block is FlowBlock => Boolean(block));

  return (
    <div className="resume-flow-screen mx-auto" style={{ width: `${PAGE_WIDTH_MM}mm` }}>
      {/* Off-screen measure tree — same edit chrome as visible pages */}
      <div
        className="pointer-events-none absolute opacity-0"
        aria-hidden
        style={{ left: -10000, top: 0, width: `${PAGE_WIDTH_MM}mm` }}
      >
        <EditModeContext.Provider value={{ isEditing, toggle }}>
          <div ref={measureRef} className={`resume-flow-body ${layoutDef.className}`} style={paperStyle}>
            <FlowBlockList
              blocks={blocks}
              data={data}
              hideContactInfo={hideContactInfo}
              withMeasureIds
            />
          </div>
        </EditModeContext.Provider>
      </div>

      <div
        className={`resume-word-stack flex flex-col items-center ${printMode ? 'resume-flow-print' : ''} ${
          printMode && isReady ? 'is-ready' : ''
        }`}
        data-print-page-count={printMode ? pages.length : undefined}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={`page-${pageIndex}`}
            className={`resume-word-page relative bg-[var(--resume-paper)] ${
              printMode ? 'resume-print-page' : ''
            } ${
              showShadow && !printMode
                ? 'shadow-[0_1px_2px_rgba(0,0,0,0.07),0_10px_28px_rgba(0,0,0,0.14)]'
                : printMode
                  ? ''
                  : 'border border-[var(--resume-border)]'
            }`}
            style={{
              width: `${PAGE_WIDTH_MM}mm`,
              minHeight: `${PAGE_TOTAL_MM}mm`,
              // Never clip — oversized atomic blocks grow the sheet instead of cutting text
              overflow: 'visible',
              marginBottom: !printMode && pageIndex < pages.length - 1 ? PAGE_GAP_PX : 0,
              boxSizing: 'border-box',
            }}
          >
            <div
              className={`resume-flow-body ${layoutDef.className}`}
              style={paperStyle}
              data-density={layoutDef.density}
            >
              <FlowBlockList
                blocks={pageBlocks(page)}
                data={data}
                onChange={onChange}
                hideContactInfo={hideContactInfo}
              />
            </div>

            {!printMode && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end px-3 pb-2 no-print">
                <span className="rounded bg-[var(--resume-paper)]/90 px-1.5 text-[9px] tabular-nums text-[var(--resume-subtle)]">
                  {pageIndex + 1} / {pages.length}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
