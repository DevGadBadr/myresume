import { PDFDocument, PageSizes, rgb } from 'pdf-lib';

const A4 = PageSizes.A4;
const HEIGHT_EPSILON = 0.5;

function toUint8Array(image: Buffer | Uint8Array): Uint8Array {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(image)) {
    return new Uint8Array(image);
  }
  return image;
}

export interface ImagePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Prefer full-width, top-aligned placement (no side letterboxing).
 * If the sheet is taller than A4 after width-scale, fall back to uniform
 * scale-to-fit so content is never clipped.
 */
export function computePageImagePlacement(
  imageWidth: number,
  imageHeight: number,
  pageW: number,
  pageH: number
): ImagePlacement {
  const widthScale = pageW / imageWidth;
  const heightIfWidthScaled = imageHeight * widthScale;

  if (heightIfWidthScaled <= pageH + HEIGHT_EPSILON) {
    const drawW = pageW;
    const drawH = heightIfWidthScaled;
    return {
      x: 0,
      y: pageH - drawH,
      width: drawW,
      height: drawH,
    };
  }

  const scale = Math.min(pageW / imageWidth, pageH / imageHeight);
  const drawW = imageWidth * scale;
  const drawH = imageHeight * scale;
  return {
    x: (pageW - drawW) / 2,
    y: pageH - drawH,
    width: drawW,
    height: drawH,
  };
}

/**
 * Assemble one A4 PDF page per sheet screenshot.
 */
export async function buildPdfFromPageImages(
  images: Array<Buffer | Uint8Array>
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('No page images to assemble into PDF');
  }

  const doc = await PDFDocument.create();
  const [pageW, pageH] = A4;

  for (const imageBytes of images) {
    const embedded = await doc.embedPng(toUint8Array(imageBytes));
    const page = doc.addPage([pageW, pageH]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
      color: rgb(1, 1, 1),
    });

    const placement = computePageImagePlacement(
      embedded.width,
      embedded.height,
      pageW,
      pageH
    );

    page.drawImage(embedded, placement);
  }

  return doc.save();
}
