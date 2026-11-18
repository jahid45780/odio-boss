'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { ThemeProvider, useTheme } from './theme-provider';
import type { ThemeConfig } from '@/lib/theme-defaults';

function AdaptiveToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        },
      }}
    />
  );
}

export function Providers({
  children,
  initialThemeConfig,
}: {
  children: React.ReactNode;
  initialThemeConfig?: ThemeConfig;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialThemeConfig={initialThemeConfig}>
        <MotionConfig reducedMotion="user">
          {children}
          <AdaptiveToaster />
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
