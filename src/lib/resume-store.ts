import { connectDB } from '@/lib/mongodb';
import { DEFAULT_RESUME_DATA } from '@/lib/defaultData';
import { Resume } from '@/lib/models/Resume';
import { RESUME_DOCUMENT_SLUG } from '@/lib/config';
import { normalizeResumeData, normalizeStoredResume } from '@/lib/resume-validation';
import type { ResumeData } from '@/types/resume';

type ResumeLeanDocument = ResumeData & {
  _id?: unknown;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

async function findLegacyResume() {
  const legacyDoc = await Resume.findOne({}).lean<ResumeLeanDocument | null>();
  if (!legacyDoc) {
    return null;
  }

  if (legacyDoc.slug !== RESUME_DOCUMENT_SLUG) {
    await Resume.updateOne(
      { _id: legacyDoc._id },
      { $set: { slug: RESUME_DOCUMENT_SLUG } },
      { runValidators: false }
    );
  }

  return legacyDoc;
}

export async function getResumeData(): Promise<ResumeData> {
  await connectDB();

  const doc =
    (await Resume.findOne({ slug: RESUME_DOCUMENT_SLUG }).lean<ResumeLeanDocument | null>()) ??
    (await findLegacyResume());

  return doc ? normalizeStoredResume(doc) : DEFAULT_RESUME_DATA;
}

export async function saveResumeData(input: unknown) {
  await connectDB();

  const data = normalizeResumeData(input);
  const updatedDoc = await Resume.findOneAndUpdate(
    { slug: RESUME_DOCUMENT_SLUG },
    { $set: { ...data, slug: RESUME_DOCUMENT_SLUG } },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean<ResumeLeanDocument | null>();

  return {
    data: updatedDoc ? normalizeStoredResume(updatedDoc) : data,
    savedAt: updatedDoc?.updatedAt instanceof Date
      ? updatedDoc.updatedAt.toISOString()
      : new Date().toISOString(),
  };
}
