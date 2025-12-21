'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{ duration: 4000 }}
    />
  );
}
