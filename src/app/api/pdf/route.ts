import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { APP_BASE_PATH } from '@/lib/config';

export async function POST(req: Request) {
  let browser = null;
  try {
    const body = (await req.json().catch(() => null)) as { templateId?: string } | null;
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport to A4 dimensions at 96dpi (210mm × 297mm)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const requestUrl = new URL(req.url);
    const printUrl = new URL(`${APP_BASE_PATH}/print`, requestUrl.origin);
    if (body?.templateId) {
      printUrl.searchParams.set('template', body.templateId);
    }

    await page.goto(printUrl.toString(), {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForFunction(() => document.body.dataset.printReady === 'true', {
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

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
    if (browser) await browser.close();
  }
}
