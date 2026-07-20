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
        pageBreakBefore: { type: Boolean, required: false },
      },
    ],
    projects: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        bullets: [{ type: String, required: true }],
        tags: [{ type: String, required: true }],
        pageBreakBefore: { type: Boolean, required: false },
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
    skills: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        category: { type: String, required: false },
      },
    ],
    education: [
      {
        id: { type: String, required: true },
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        period: { type: String, required: true },
        pageBreakBefore: { type: Boolean, required: false },
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
        pageBreakBefore: { type: Boolean, required: false },
      },
    ],
    activeTemplateId: { type: String, required: false },
    layoutId: { type: String, enum: ['classic', 'split', 'compact'], required: false },
    sectionOrder: [{ type: String, required: false }],
    sectionSpacers: [
      {
        afterSection: { type: String, required: true },
        lines: { type: Number, required: true },
      },
    ],
    layout: {
      controls: [
        {
          id: { type: String, required: true },
          type: { type: String, enum: ['spacer', 'pageBreak'], required: true },
          anchor: { type: Schema.Types.Mixed, required: true },
          heightMm: { type: Number, required: false },
        },
      ],
      sections: { type: Schema.Types.Mixed, required: false },
      pageMargins: {
        top: { type: Number, required: false },
        right: { type: Number, required: false },
        bottom: { type: Number, required: false },
        left: { type: Number, required: false },
      },
    },
    templates: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        targetTitle: { type: String, required: false },
        hideContactInfo: { type: Boolean, required: true, default: false },
        layoutId: { type: String, enum: ['classic', 'split', 'compact'], required: false },
        sectionOrder: [{ type: String, required: false }],
        sectionSpacers: [
          {
            afterSection: { type: String, required: true },
            lines: { type: Number, required: true },
          },
        ],
        content: {
          about: { type: String, required: true },
          experience: [
            {
              id: { type: String, required: true },
              role: { type: String, required: true },
              roleSubtitle: { type: String, required: true },
              company: { type: String, required: true },
              period: { type: String, required: true },
              bullets: [{ type: String, required: true }],
              pageBreakBefore: { type: Boolean, required: false },
            },
          ],
          projects: [
            {
              id: { type: String, required: true },
              title: { type: String, required: true },
              description: { type: String, required: true },
              bullets: [{ type: String, required: true }],
              tags: [{ type: String, required: true }],
              pageBreakBefore: { type: Boolean, required: false },
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
          skills: [
            {
              id: { type: String, required: true },
              label: { type: String, required: true },
              category: { type: String, required: false },
            },
          ],
          education: [
            {
              id: { type: String, required: true },
              degree: { type: String, required: true },
              institution: { type: String, required: true },
              period: { type: String, required: true },
              pageBreakBefore: { type: Boolean, required: false },
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
              pageBreakBefore: { type: Boolean, required: false },
            },
          ],
          layout: {
            controls: [
              {
                id: { type: String, required: true },
                type: { type: String, enum: ['spacer', 'pageBreak'], required: true },
                anchor: { type: Schema.Types.Mixed, required: true },
                heightMm: { type: Number, required: false },
              },
            ],
            sections: { type: Schema.Types.Mixed, required: false },
            pageMargins: {
              top: { type: Number, required: false },
              right: { type: Number, required: false },
              bottom: { type: Number, required: false },
              left: { type: Number, required: false },
            },
          },
        },
      },
    ],
  },
  { timestamps: true, strict: true }
);

export const Resume =
  mongoose.models.Resume ||
  mongoose.model<ResumeDocument>('Resume', ResumeSchema);
