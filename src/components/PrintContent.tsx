'use client';

import type { ResumeData } from '@/types/resume';
import { EditModeContext } from '@/context/EditModeContext';
import ResumeFlowDocument from '@/components/ResumeFlowDocument';
import type { ColorTheme } from '@/lib/theme';

const noop = () => {};

interface PrintContentProps {
  data: ResumeData;
  hideContactInfo?: boolean;
  theme: ColorTheme;
}

export default function PrintContent({ data, hideContactInfo = false, theme }: PrintContentProps) {
  return (
    <EditModeContext.Provider value={{ isEditing: false, toggle: noop }}>
      <div data-theme={theme}>
        <ResumeFlowDocument
          data={data}
          hideContactInfo={hideContactInfo}
          printMode
          layoutId={data.layoutId}
        />
      </div>
    </EditModeContext.Provider>
  );
}
