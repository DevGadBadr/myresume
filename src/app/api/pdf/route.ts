import { NextResponse } from 'next/server';
import { homedir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { APP_BASE_PATH } from '@/lib/config';
import { buildPdfFromPageImages } from '@/lib/pdf/build-pdf-from-page-images';
import {
  deletePrintSnapshot,
  normalizePrintSource,
  putPrintSnapshot,
  type PrintSource,
} from '@/lib/pdf/print-snapshot-store';
import { tryNormalizeResumeData } from '@/lib/resume-validation';
import { getResumeData } from '@/lib/resume-store';
import { normalizeColorTheme } from '@/lib/theme';
import { PAGE_TOTAL_MM, PAGE_WIDTH_MM } from '@/lib/page-layout';

/** A4 CSS pixels at 96dpi (matches setViewport). */
const A4_WIDTH_PX = Math.round((PAGE_WIDTH_MM / 25.4) * 96);
const A4_HEIGHT_PX = Math.round((PAGE_TOTAL_MM / 25.4) * 96);

function getPrintOrigin(req: Request) {
  const requestUrl = new URL(req.url);

  if (requestUrl.protocol === 'http:') {
    return requestUrl.origin;
  }

  const port = process.env.PORT || requestUrl.port || '3007';
  return `http://127.0.0.1:${port}`;
}

function ensurePuppeteerCacheDir() {
  if (!process.env.PUPPETEER_CACHE_DIR) {
    process.env.PUPPETEER_CACHE_DIR = join(homedir(), '.cache', 'puppeteer');
  }
}

export async function POST(req: Request) {
  let browser = null;
  let printToken: string | null = null;
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          templateId?: string;
          theme?: string;
          source?: string;
          resume?: unknown;
        }
      | null;
    const theme = normalizeColorTheme(body?.theme);
    const source: PrintSource = normalizePrintSource(body?.source);
    const templateId = typeof body?.templateId === 'string' ? body.templateId : undefined;

    let resumeData;
    if (body?.resume !== undefined) {
      const normalized = tryNormalizeResumeData(body.resume);
      if (!normalized.ok) {
        return NextResponse.json(
          { error: 'Invalid resume snapshot', code: 'INVALID_RESUME_PAYLOAD' },
          { status: 400 }
        );
      }
      resumeData = normalized.data;
    } else {
      resumeData = await getResumeData();
    }

    printToken = putPrintSnapshot(resumeData, source, templateId);

    ensurePuppeteerCacheDir();
    browser = await puppeteer.launch({
      executablePath: puppeteer.executablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport to A4 dimensions at 96dpi (210mm × 297mm)
    await page.setViewport({
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      deviceScaleFactor: 2,
    });
    // Export from the same media mode as the on-screen preview so pagination
    // uses identical font metrics and spacing.
    await page.emulateMediaType('screen');

    const printUrl = new URL(`${APP_BASE_PATH}/print`, getPrintOrigin(req));
    printUrl.searchParams.set('token', printToken);
    printUrl.searchParams.set('source', source);
    if (templateId) {
      printUrl.searchParams.set('template', templateId);
    }
    printUrl.searchParams.set('theme', theme);

    await page.goto(printUrl.toString(), {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForFunction(() => document.body.dataset.printReady === 'true', {
      timeout: 30000,
    });

    await page.waitForFunction(() => {
      const expected = Number(document.body.dataset.printPageCount || '0');
      const actual = document.querySelectorAll('.resume-print-page').length;
      return expected > 0 && actual === expected;
    }, { timeout: 30000 });

    const sheetHandles = await page.$$('.resume-print-page');
    if (sheetHandles.length === 0) {
      throw new Error('No print pages found to screenshot');
    }

    const images: Buffer[] = [];
    for (const handle of sheetHandles) {
      const box = await handle.boundingBox();
      if (!box) {
        throw new Error('Print page has no layout box');
      }

      const overflowTolerancePx = 2;
      let shot: Buffer | Uint8Array;
      if (box.height <= A4_HEIGHT_PX + overflowTolerancePx) {
        // Clip tiny measurement overgrowth to exact A4 — avoids side letterboxing.
        shot = await page.screenshot({
          type: 'png',
          clip: {
            x: box.x,
            y: box.y,
            width: Math.min(box.width, A4_WIDTH_PX),
            height: Math.min(box.height, A4_HEIGHT_PX),
          },
        });
      } else {
        // Truly oversized atomic sheet: capture full content; pdf-lib scale-to-fits.
        shot = await handle.screenshot({ type: 'png' });
      }
      images.push(Buffer.from(shot));
    }

    const pdf = await buildPdfFromPageImages(images);

    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  } finally {
    if (printToken) {
      deletePrintSnapshot(printToken);
    }
    if (browser) await browser.close();
  }
}
