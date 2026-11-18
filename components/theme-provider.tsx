'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WebsiteSettings } from '@/lib/types';
import {
  DEFAULT_THEME_CONFIG,
  FONT_SCALE_MAP,
  FONT_VAR_MAP,
  RADIUS_MAP,
  SPACING_MAP,
  mergeThemeConfig,
  type ThemeConfig,
  type ThemePreference,
} from '@/lib/theme-defaults';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'dark' | 'light';
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  activeConfig: ThemeConfig;
  isPreviewing: boolean;
  startPreview: (config: ThemeConfig) => void;
  stopPreview: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_PREF_KEY = 'soniq-theme';
const STORAGE_CFG_KEY = 'soniq-theme-config';

const emptySubscribe = () => () => {};

function subscribeSystemTheme(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getSystemSnapshot(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDom(resolved: 'dark' | 'light', config: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  const palette = resolved === 'dark' ? config.darkPalette : config.lightPalette;
  const radius = RADIUS_MAP[config.layout.borderRadius] || RADIUS_MAP.rounded;
  const sectionPy = SPACING_MAP[config.layout.sectionSpacing] || SPACING_MAP.balanced;
  const fontScale = FONT_SCALE_MAP[config.typography.baseSizeScale] || '1';
  const displayFont = FONT_VAR_MAP[config.typography.displayFont] || FONT_VAR_MAP.outfit;
  const bodyFont = FONT_VAR_MAP[config.typography.bodyFont] || FONT_VAR_MAP.manrope;

  root.style.setProperty('--bg-primary', palette.background);
  root.style.setProperty('--bg-secondary', palette.secondaryBackground);
  root.style.setProperty('--bg-card', palette.cardBackground);
  root.style.setProperty('--bg-elevated', palette.elevatedBackground);
  root.style.setProperty('--text-primary', palette.textPrimary);
  root.style.setProperty('--text-secondary', palette.textSecondary);
  root.style.setProperty('--accent-primary', palette.accentPrimary);
  root.style.setProperty('--accent-secondary', palette.accentSecondary);
  root.style.setProperty('--accent-contrast', palette.buttonText);
  root.style.setProperty('--btn-bg', palette.buttonBg);
  root.style.setProperty('--btn-text', palette.buttonText);
  root.style.setProperty('--border-subtle', palette.border);
  root.style.setProperty(
    '--border-strong',
    resolved === 'dark' ? 'rgba(255,255,255,0.20)' : '#CBD5E1'
  );
  root.style.setProperty('--radius-card', radius.card);
  root.style.setProperty('--radius-control', radius.control);
  root.style.setProperty('--section-py', sectionPy);
  root.style.setProperty('--font-scale', fontScale);
  root.style.setProperty('--font-display-active', displayFont);
  root.style.setProperty('--font-body-active', bodyFont);
}

export function ThemeProvider({
  children,
  initialThemeConfig,
}: {
  children: React.ReactNode;
  initialThemeConfig?: ThemeConfig;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const systemTheme = useSyncExternalStore(subscribeSystemTheme, getSystemSnapshot, () => 'dark');

  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as WebsiteSettings,
  });

  const publishedConfig = useMemo(
    () => mergeThemeConfig(settings?.themeConfig ?? initialThemeConfig ?? DEFAULT_THEME_CONFIG),
    [settings?.themeConfig, initialThemeConfig]
  );

  const [previewConfig, setPreviewConfig] = useState<ThemeConfig | null>(null);
  const activeConfig = previewConfig ?? publishedConfig;

  const [storedPref, setStoredPref] = useState<ThemePreference | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = window.localStorage.getItem(STORAGE_PREF_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return null;
  });

  const preference: ThemePreference = storedPref ?? activeConfig.defaultTheme ?? 'dark';

  const resolvedTheme: 'dark' | 'light' = useMemo(() => {
    if (!activeConfig.enableDarkTheme && activeConfig.enableLightTheme) return 'light';
    if (!activeConfig.enableLightTheme && activeConfig.enableDarkTheme) return 'dark';

    const target = preference === 'system' ? systemTheme : preference;
    return target === 'light' ? 'light' : 'dark';
  }, [activeConfig.enableDarkTheme, activeConfig.enableLightTheme, preference, systemTheme]);

  useEffect(() => {
    if (!mounted) return;
    applyThemeToDom(resolvedTheme, activeConfig);
    try {
      window.localStorage.setItem(STORAGE_CFG_KEY, JSON.stringify(publishedConfig));
    } catch {
      // ignore storage errors
    }
  }, [mounted, resolvedTheme, activeConfig, publishedConfig]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      if (next === 'dark' && !activeConfig.enableDarkTheme) return;
      if (next === 'light' && !activeConfig.enableLightTheme) return;
      setStoredPref(next);
      try {
        window.localStorage.setItem(STORAGE_PREF_KEY, next);
      } catch {
        // ignore storage errors
      }
    },
    [activeConfig.enableDarkTheme, activeConfig.enableLightTheme]
  );

  const toggleTheme = useCallback(() => {
    if (resolvedTheme === 'dark' && activeConfig.enableLightTheme) {
      setPreference('light');
    } else if (resolvedTheme === 'light' && activeConfig.enableDarkTheme) {
      setPreference('dark');
    }
  }, [resolvedTheme, activeConfig.enableDarkTheme, activeConfig.enableLightTheme, setPreference]);

  const startPreview = useCallback((cfg: ThemeConfig) => {
    setPreviewConfig(mergeThemeConfig(cfg));
  }, []);

  const stopPreview = useCallback(() => {
    setPreviewConfig(null);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      toggleTheme,
      activeConfig,
      isPreviewing: Boolean(previewConfig),
      startPreview,
      stopPreview,
    }),
    [preference, resolvedTheme, setPreference, toggleTheme, activeConfig, previewConfig, startPreview, stopPreview]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {previewConfig && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-accent-primary/40 bg-surface-card px-4 py-2.5 text-xs text-ink-primary shadow-theme-card">
          <span className="font-medium">Previewing draft theme</span>
          <button
            type="button"
            onClick={stopPreview}
            className="rounded bg-surface-elevated px-2.5 py-1 text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
          >
            Exit Preview
          </button>
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
