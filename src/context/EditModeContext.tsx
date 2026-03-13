'use client';

import { createContext, useContext } from 'react';

interface EditModeContextValue {
  isEditing: boolean;
  toggle: () => void;
}

export const EditModeContext = createContext<EditModeContextValue>({
  isEditing: false,
  toggle: () => {},
});

export function useEditMode() {
  return useContext(EditModeContext);
}
