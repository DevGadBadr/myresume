import type { PageMarginsMm, ResumeLayoutSettings } from '@/types/resume';

export const PAGE_WIDTH_MM = 210;
export const PAGE_TOTAL_MM = 297;
export const PAGE_MARGIN_MM = 12;
export const PAGE_CONTENT_MM = PAGE_TOTAL_MM - PAGE_MARGIN_MM * 2;

export const MIN_PAGE_MARGIN_MM = 5;
export const MAX_PAGE_MARGIN_MM = 40;
export const MIN_PAGE_CONTENT_MM = 40;

export const DEFAULT_PAGE_MARGINS: PageMarginsMm = {
  top: PAGE_MARGIN_MM,
  right: PAGE_MARGIN_MM,
  bottom: PAGE_MARGIN_MM,
  left: PAGE_MARGIN_MM,
};

export function clampMarginMm(value: number): number {
  return Math.min(MAX_PAGE_MARGIN_MM, Math.max(MIN_PAGE_MARGIN_MM, value));
}

export function resolvePageMargins(layout?: ResumeLayoutSettings | null): PageMarginsMm {
  const partial = layout?.pageMargins;
  const margins: PageMarginsMm = {
    top: partial?.top ?? DEFAULT_PAGE_MARGINS.top,
    right: partial?.right ?? DEFAULT_PAGE_MARGINS.right,
    bottom: partial?.bottom ?? DEFAULT_PAGE_MARGINS.bottom,
    left: partial?.left ?? DEFAULT_PAGE_MARGINS.left,
  };

  margins.top = clampMarginMm(margins.top);
  margins.right = clampMarginMm(margins.right);
  margins.bottom = clampMarginMm(margins.bottom);
  margins.left = clampMarginMm(margins.left);

  const maxVertical = PAGE_TOTAL_MM - MIN_PAGE_CONTENT_MM;
  const maxHorizontal = PAGE_WIDTH_MM - MIN_PAGE_CONTENT_MM;
  if (margins.top + margins.bottom > maxVertical) {
    const scale = maxVertical / (margins.top + margins.bottom);
    margins.top *= scale;
    margins.bottom *= scale;
  }
  if (margins.left + margins.right > maxHorizontal) {
    const scale = maxHorizontal / (margins.left + margins.right);
    margins.left *= scale;
    margins.right *= scale;
  }

  return margins;
}

export function pageContentHeightMm(margins: PageMarginsMm): number {
  return PAGE_TOTAL_MM - margins.top - margins.bottom;
}

export function pageContentWidthMm(margins: PageMarginsMm): number {
  return PAGE_WIDTH_MM - margins.left - margins.right;
}
