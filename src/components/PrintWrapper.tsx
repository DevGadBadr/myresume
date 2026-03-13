'use client';

import { EditModeContext } from '@/context/EditModeContext';

export default function PrintWrapper({ children }: { children: React.ReactNode }) {
  return (
    <EditModeContext.Provider value={{ isEditing: false, toggle: () => {} }}>
      {children}
    </EditModeContext.Provider>
  );
}
