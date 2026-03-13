import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ResumeValidationError } from '@/lib/resume-validation';
import { getResumeData, saveResumeData } from '@/lib/resume-store';

export async function GET() {
  try {
    const data = await getResumeData();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/resume error:', err);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const result = await saveResumeData(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ResumeValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'INVALID_RESUME_PAYLOAD' },
        { status: 400 }
      );
    }

    console.error('PUT /api/resume error:', err);
    return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
  }
}
