export type ThemePreference = 'dark' | 'light' | 'system';

export type FontChoice = 'outfit' | 'manrope' | 'plus_jakarta' | 'dm_sans' | 'urbanist';
export type FontScale = 'compact' | 'standard' | 'large';
export type RadiusScale = 'sharp' | 'medium' | 'rounded' | 'soft';
export type SpacingScale = 'compact' | 'balanced' | 'spacious';

export interface ThemePalette {
  background: string;
  secondaryBackground: string;
  cardBackground: string;
  elevatedBackground: string;
  textPrimary: string;
  textSecondary: string;
  accentPrimary: string;
  accentSecondary: string;
  buttonBg: string;
  buttonText: string;
  border: string;
}

export interface ThemeConfig {
  defaultTheme: ThemePreference;
  enableDarkTheme: boolean;
  enableLightTheme: boolean;
  darkPalette: ThemePalette;
  lightPalette: ThemePalette;
  typography: {
    displayFont: FontChoice;
    bodyFont: FontChoice;
    baseSizeScale: FontScale;
  };
  layout: {
    borderRadius: RadiusScale;
    sectionSpacing: SpacingScale;
  };
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'dark',
  enableDarkTheme: true,
  enableLightTheme: true,
  darkPalette: {
    background: '#050608',
    secondaryBackground: '#0B1018',
    cardBackground: '#101722',
    elevatedBackground: '#141E2C',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1AAB8',
    accentPrimary: '#00B8FF',
    accentSecondary: '#1677FF',
    buttonBg: '#00B8FF',
    buttonText: '#050608',
    border: 'rgba(255,255,255,0.10)',
  },
  lightPalette: {
    background: '#FFFFFF',
    secondaryBackground: '#F5F7FA',
    cardBackground: '#FFFFFF',
    elevatedBackground: '#F1F5F9',
    textPrimary: '#111827',
    textSecondary: '#64748B',
    accentPrimary: '#0077CC',
    accentSecondary: '#2563EB',
    buttonBg: '#0077CC',
    buttonText: '#FFFFFF',
    border: '#E2E8F0',
  },
  typography: {
    displayFont: 'outfit',
    bodyFont: 'manrope',
    baseSizeScale: 'standard',
  },
  layout: {
    borderRadius: 'rounded',
    sectionSpacing: 'balanced',
  },
};

export const FONT_VAR_MAP: Record<FontChoice, string> = {
  outfit: 'var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
  manrope: 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif',
  plus_jakarta: 'var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif',
  dm_sans: 'var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif',
  urbanist: 'var(--font-urbanist), ui-sans-serif, system-ui, sans-serif',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  outfit: 'Outfit (Geometric Display)',
  manrope: 'Manrope (Precision Sans)',
  plus_jakarta: 'Plus Jakarta Sans',
  dm_sans: 'DM Sans',
  urbanist: 'Urbanist',
};

export const RADIUS_MAP: Record<RadiusScale, { card: string; control: string }> = {
  sharp: { card: '0.375rem', control: '0.25rem' },
  medium: { card: '0.625rem', control: '0.5rem' },
  rounded: { card: '0.875rem', control: '0.5rem' },
  soft: { card: '1.25rem', control: '0.75rem' },
};

export const SPACING_MAP: Record<SpacingScale, string> = {
  compact: '3.5rem',
  balanced: '5rem',
  spacious: '6.5rem',
};

export const FONT_SCALE_MAP: Record<FontScale, string> = {
  compact: '0.94',
  standard: '1',
  large: '1.06',
};

export function mergeThemeConfig(input?: Partial<ThemeConfig> | null): ThemeConfig {
  if (!input) return DEFAULT_THEME_CONFIG;
  return {
    defaultTheme: input.defaultTheme ?? DEFAULT_THEME_CONFIG.defaultTheme,
    enableDarkTheme: input.enableDarkTheme ?? DEFAULT_THEME_CONFIG.enableDarkTheme,
    enableLightTheme: input.enableLightTheme ?? DEFAULT_THEME_CONFIG.enableLightTheme,
    darkPalette: { ...DEFAULT_THEME_CONFIG.darkPalette, ...(input.darkPalette || {}) },
    lightPalette: { ...DEFAULT_THEME_CONFIG.lightPalette, ...(input.lightPalette || {}) },
    typography: { ...DEFAULT_THEME_CONFIG.typography, ...(input.typography || {}) },
    layout: { ...DEFAULT_THEME_CONFIG.layout, ...(input.layout || {}) },
  };
}
