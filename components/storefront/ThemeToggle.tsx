'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, resolvedTheme, setPreference, activeConfig } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const canDark = activeConfig.enableDarkTheme;
  const canLight = activeConfig.enableLightTheme;

  // If admin disabled one of the modes completely, hide switching UI gracefully
  if (!canDark || !canLight) {
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={
            mounted
              ? `Switch theme (current: ${resolvedTheme} via ${preference})`
              : 'Switch theme'
          }
          title="Theme appearance"
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-theme-control border border-line-subtle bg-surface-card text-ink-secondary hover:border-accent-primary/50 hover:text-ink-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
            className
          )}
        >
          {!mounted || resolvedTheme === 'dark' ? (
            <Moon className="h-4.5 w-4.5 text-accent-primary transition-transform duration-200" />
          ) : (
            <Sun className="h-4.5 w-4.5 text-accent-primary transition-transform duration-200" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[168px] rounded-theme-card border border-line-subtle bg-surface-card p-1.5 text-ink-primary shadow-theme-card animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Label className="px-2.5 py-1 text-[11px] font-medium text-ink-secondary">
            Appearance
          </DropdownMenu.Label>

          <DropdownMenu.Item
            onSelect={() => setPreference('dark')}
            className="flex items-center justify-between rounded-theme-control px-2.5 py-2 text-xs font-medium text-ink-primary outline-none hover:bg-surface-elevated focus:bg-surface-elevated cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-accent-primary" />
              Dark Mode
            </span>
            {mounted && preference === 'dark' && <Check className="h-3.5 w-3.5 text-accent-primary" />}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => setPreference('light')}
            className="flex items-center justify-between rounded-theme-control px-2.5 py-2 text-xs font-medium text-ink-primary outline-none hover:bg-surface-elevated focus:bg-surface-elevated cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-accent-primary" />
              Light Mode
            </span>
            {mounted && preference === 'light' && <Check className="h-3.5 w-3.5 text-accent-primary" />}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => setPreference('system')}
            className="flex items-center justify-between rounded-theme-control px-2.5 py-2 text-xs font-medium text-ink-primary outline-none hover:bg-surface-elevated focus:bg-surface-elevated cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5 text-ink-secondary" />
              System
            </span>
            {mounted && preference === 'system' && <Check className="h-3.5 w-3.5 text-accent-primary" />}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
