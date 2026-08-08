import assert from 'node:assert/strict';
import test from 'node:test';
import { PDFDocument, PageSizes } from 'pdf-lib';
import {
  buildPdfFromPageImages,
  computePageImagePlacement,
} from '@/lib/pdf/build-pdf-from-page-images';

// 1×1 white PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('buildPdfFromPageImages rejects empty image list', async () => {
  await assert.rejects(() => buildPdfFromPageImages([]), /No page images/);
});

test('buildPdfFromPageImages builds multi-page A4 PDF from PNGs', async () => {
  const pdf = await buildPdfFromPageImages([TINY_PNG, TINY_PNG]);
  assert.ok(pdf.byteLength > 0);
  const header = Buffer.from(pdf.subarray(0, 5)).toString('ascii');
  assert.equal(header, '%PDF-');
  const loaded = await PDFDocument.load(pdf);
  assert.equal(loaded.getPageCount(), 2);
  const { width, height } = loaded.getPage(0).getSize();
  assert.ok(Math.abs(width - 595.28) < 0.1);
  assert.ok(Math.abs(height - 841.89) < 0.1);
});

test('computePageImagePlacement fills width and top-aligns when sheet fits', () => {
  const [pageW, pageH] = PageSizes.A4;
  const placement = computePageImagePlacement(794, 1000, pageW, pageH);
  assert.equal(placement.x, 0);
  assert.ok(Math.abs(placement.width - pageW) < 0.01);
  assert.ok(placement.y + placement.height <= pageH + 0.01);
  assert.ok(Math.abs(placement.y + placement.height - pageH) < 0.01);
});

test('computePageImagePlacement avoids side gutters for exact A4 screenshots', () => {
  const [pageW, pageH] = PageSizes.A4;
  const placement = computePageImagePlacement(1588, 2246, pageW, pageH);
  assert.equal(placement.x, 0);
  assert.ok(Math.abs(placement.width - pageW) < 0.01);
});

test('computePageImagePlacement scale-to-fits oversized tall sheets', () => {
  const [pageW, pageH] = PageSizes.A4;
  const placement = computePageImagePlacement(794, 1400, pageW, pageH);
  assert.ok(placement.height <= pageH + 0.01);
  assert.ok(placement.width <= pageW + 0.01);
  assert.ok(Math.abs(placement.y + placement.height - pageH) < 0.01);
});
