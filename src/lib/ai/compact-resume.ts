import type { ResumeData, ResumeTemplate } from '@/types/resume';
import type { CompactDraft, CompactLibrary } from '@/lib/ai/types';

export function compactLibrary(data: ResumeData): CompactLibrary {
  return {
    title: data.personalInfo.title,
    about: data.about,
    experience: data.experience.map((entry) => ({
      id: entry.id,
      role: entry.role,
      roleSubtitle: entry.roleSubtitle,
      company: entry.company,
      period: entry.period,
      bullets: [...entry.bullets],
    })),
    projects: data.projects.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      bullets: [...entry.bullets],
      tags: [...entry.tags],
    })),
    skills: data.skills.map((entry) => ({
      id: entry.id,
      label: entry.label,
      ...(entry.category ? { category: entry.category } : {}),
    })),
    education: data.education.map((entry) => ({
      id: entry.id,
      degree: entry.degree,
      institution: entry.institution,
      period: entry.period,
    })),
    certificates: data.certificates.map((entry) => ({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer,
      date: entry.date,
      ...(entry.hours ? { hours: entry.hours } : {}),
    })),
    ...(data.sectionOrder ? { sectionOrder: [...data.sectionOrder] } : {}),
  };
}

export function compactDraftTemplate(template: ResumeTemplate): CompactDraft {
  return {
    name: template.name,
    ...(template.targetTitle ? { targetTitle: template.targetTitle } : {}),
    about: template.content.about,
    experience: template.content.experience.map((entry) => ({
      id: entry.id,
      role: entry.role,
      roleSubtitle: entry.roleSubtitle,
      company: entry.company,
      period: entry.period,
      bullets: [...entry.bullets],
    })),
    projects: template.content.projects.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      bullets: [...entry.bullets],
      tags: [...entry.tags],
    })),
    skills: template.content.skills.map((entry) => ({
      id: entry.id,
      label: entry.label,
      ...(entry.category ? { category: entry.category } : {}),
    })),
    education: template.content.education.map((entry) => ({
      id: entry.id,
      degree: entry.degree,
      institution: entry.institution,
      period: entry.period,
    })),
    certificates: template.content.certificates.map((entry) => ({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer,
      date: entry.date,
      ...(entry.hours ? { hours: entry.hours } : {}),
    })),
    ...(template.sectionOrder ? { sectionOrder: [...template.sectionOrder] } : {}),
  };
}

export function truncateJobDescription(jobDescription: string, maxChars = 6000) {
  const trimmed = jobDescription.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}\n…[truncated]`;
}
