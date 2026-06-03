'use client';

import type { ReactNode } from 'react';
import type { SectionKey } from '@/types/resume';

interface BlockShellProps {
  blockId: string;
  section?: SectionKey;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

export default function BlockShell({
  blockId,
  section,
  className = '',
  style,
  children,
}: BlockShellProps) {
  return (
    <div
      data-resume-block-id={blockId}
      data-resume-section={section}
      className={`resume-block ${section ? 'resume-section-block' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
