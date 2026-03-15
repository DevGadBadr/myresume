import mongoose, { Schema } from 'mongoose';
import type { ResumeData } from '@/types/resume';

export interface ResumeDocument extends ResumeData {
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ResumeSchema = new Schema<ResumeDocument>(
  {
    slug: { type: String, required: true, unique: true, default: 'primary' },
    personalInfo: {
      name: { type: String, required: true },
      title: { type: String, required: true },
      email: { type: String, required: true },
      phones: [{ type: String, required: true }],
      location: { type: String, required: true },
      links: [
        {
          label: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
    },
    about: { type: String, required: true },
    experience: [
      {
        id: { type: String, required: true },
        role: { type: String, required: true },
        roleSubtitle: { type: String, required: true },
        company: { type: String, required: true },
        period: { type: String, required: true },
        bullets: [{ type: String, required: true }],
      },
    ],
    projects: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        bullets: [{ type: String, required: true }],
        tags: [{ type: String, required: true }],
        deployment: {
          url: { type: String, required: false },
          credentials: [
            {
              id: { type: String, required: true },
              label: { type: String, required: true },
              value: { type: String, required: true },
            },
          ],
        },
      },
    ],
    skills: [{ type: String, required: true }],
    education: [
      {
        id: { type: String, required: true },
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        period: { type: String, required: true },
      },
    ],
    certificates: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        issuer: { type: String, required: true },
        date: { type: String, required: true },
        hours: { type: String, required: false },
        link: { type: String, required: false },
      },
    ],
  },
  { timestamps: true, strict: true }
);

export const Resume =
  mongoose.models.Resume ||
  mongoose.model<ResumeDocument>('Resume', ResumeSchema);
