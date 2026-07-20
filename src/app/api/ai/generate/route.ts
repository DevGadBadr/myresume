import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { generateTailoredDraft } from '@/lib/ai/openai';
import { readOptionalString, readRequiredString } from '@/lib/ai/request';
import { getResumeData } from '@/lib/resume-store';
import { ResumeValidationError } from '@/lib/resume-validation';

export async function POST(req: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const jobTitle = readRequiredString(body?.jobTitle, 'jobTitle');
    const jobDescription = readRequiredString(body?.jobDescription, 'jobDescription');
    const company = readOptionalString(body?.company);
    const notes = readOptionalString(body?.notes);

    const library = await getResumeData();
    const result = await generateTailoredDraft({
      library,
      jobTitle,
      company,
      jobDescription,
      notes,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ResumeValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'INVALID_AI_REQUEST' },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : 'Failed to generate tailored resume';
    if (message.startsWith('Missing required environment variable:')) {
      return NextResponse.json({ error: message, code: 'MISSING_OPENAI_ENV' }, { status: 500 });
    }

    console.error('POST /api/ai/generate error:', err);
    return NextResponse.json({ error: message, code: 'AI_GENERATE_FAILED' }, { status: 500 });
  }
}
