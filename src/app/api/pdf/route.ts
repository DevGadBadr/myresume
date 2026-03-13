import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { APP_BASE_PATH } from '@/lib/config';

export async function POST(req: Request) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport to A4-ish width
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });

    const port = process.env.PORT ?? '3007';
    const printUrl = new URL(`http://localhost:${port}${APP_BASE_PATH}/print`);

    await page.goto(printUrl.toString(), {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm',
      },
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
