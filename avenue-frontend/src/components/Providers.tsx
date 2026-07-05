'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ToastProvider } from './ui/toast/ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </Provider>
  );
}
