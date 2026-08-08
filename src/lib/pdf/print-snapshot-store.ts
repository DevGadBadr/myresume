import { randomBytes } from 'node:crypto';
import type { ResumeData } from '@/types/resume';

export type PrintSource = 'library' | 'template';

export interface PrintSnapshot {
  data: ResumeData;
  source: PrintSource;
  templateId?: string;
  createdAt: number;
}

const TTL_MS = 60_000;

type SnapshotGlobal = typeof globalThis & {
  __resumePrintSnapshots?: Map<string, PrintSnapshot>;
};

function getStore(): Map<string, PrintSnapshot> {
  const g = globalThis as SnapshotGlobal;
  if (!g.__resumePrintSnapshots) {
    g.__resumePrintSnapshots = new Map();
  }
  return g.__resumePrintSnapshots;
}

function pruneExpired(now = Date.now()) {
  const store = getStore();
  for (const [token, snapshot] of store) {
    if (now - snapshot.createdAt > TTL_MS) {
      store.delete(token);
    }
  }
}

export function putPrintSnapshot(
  data: ResumeData,
  source: PrintSource,
  templateId?: string
): string {
  pruneExpired();
  const token = randomBytes(24).toString('hex');
  getStore().set(token, {
    data,
    source,
    templateId,
    createdAt: Date.now(),
  });
  return token;
}

/** Read a print snapshot without removing it (print route may re-render). */
export function getPrintSnapshot(token: string): PrintSnapshot | null {
  pruneExpired();
  return getStore().get(token) ?? null;
}

export function deletePrintSnapshot(token: string) {
  getStore().delete(token);
}

export function normalizePrintSource(value: unknown): PrintSource {
  return value === 'library' ? 'library' : 'template';
}
