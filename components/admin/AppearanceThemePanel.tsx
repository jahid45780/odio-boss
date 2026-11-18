'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Moon, RotateCcw, Save, Sparkles, Sun, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  DEFAULT_THEME_CONFIG,
  FONT_LABELS,
  FONT_SCALE_MAP,
  FONT_VAR_MAP,
  RADIUS_MAP,
  mergeThemeConfig,
  type FontChoice,
  type FontScale,
  type RadiusScale,
  type SpacingScale,
  type ThemeConfig,
  type ThemePalette,
  type ThemePreference,
} from '@/lib/theme-defaults';
import type { WebsiteSettings } from '@/lib/types';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PALETTE_FIELDS: Array<{ key: keyof ThemePalette; label: string }> = [
  { key: 'background', label: 'Primary Background' },
  { key: 'secondaryBackground', label: 'Secondary Background' },
  { key: 'cardBackground', label: 'Card Background' },
  { key: 'elevatedBackground', label: 'Elevated Surface' },
  { key: 'textPrimary', label: 'Primary Text' },
  { key: 'textSecondary', label: 'Secondary Text' },
  { key: 'accentPrimary', label: 'Primary Accent' },
  { key: 'accentSecondary', label: 'Secondary Accent' },
  { key: 'buttonBg', label: 'Button Background' },
  { key: 'buttonText', label: 'Button Text' },
  { key: 'border', label: 'Border Color' },
];

function toPickerHex(value: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : fallback;
}

export function AppearanceThemePanel({ settings }: { settings: WebsiteSettings }) {
  const queryClient = useQueryClient();
  const { isPreviewing, startPreview, stopPreview } = useTheme();

  const baseTheme = mergeThemeConfig(settings.themeDraftConfig ?? settings.themeConfig);
  const [draft, setDraft] = useState<ThemeConfig | null>(null);
  const form = draft ?? baseTheme;

  const [editingMode, setEditingMode] = useState<'dark' | 'light'>('dark');
  const [busyAction, setBusyAction] = useState<'save_draft' | 'publish' | 'reset' | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const activePalette = editingMode === 'dark' ? form.darkPalette : form.lightPalette;
  const fallbackHex = editingMode === 'dark' ? '#101722' : '#ffffff';

  const updateForm = (updater: (prev: ThemeConfig) => ThemeConfig) => {
    setDraft((prev) => updater(prev ?? baseTheme));
  };

  const updatePaletteField = (key: keyof ThemePalette, val: string) => {
    updateForm((prev) => ({
      ...prev,
      [editingMode === 'dark' ? 'darkPalette' : 'lightPalette']: {
        ...(editingMode === 'dark' ? prev.darkPalette : prev.lightPalette),
        [key]: val,
      },
    }));
  };

  const handleToggleModeEnabled = (mode: 'dark' | 'light', checked: boolean) => {
    if (!checked) {
      if (mode === 'dark' && !form.enableLightTheme) {
        toast.error('At least one theme (Dark or Light) must remain enabled.');
        return;
      }
      if (mode === 'light' && !form.enableDarkTheme) {
        toast.error('At least one theme (Dark or Light) must remain enabled.');
        return;
      }
    }
    updateForm((prev) => {
      const next = {
        ...prev,
        enableDarkTheme: mode === 'dark' ? checked : prev.enableDarkTheme,
        enableLightTheme: mode === 'light' ? checked : prev.enableLightTheme,
      };
      if (!next.enableDarkTheme && next.defaultTheme === 'dark') next.defaultTheme = 'light';
      if (!next.enableLightTheme && next.defaultTheme === 'light') next.defaultTheme = 'dark';
      return next;
    });
  };

  const submitThemeAction = async (action: 'save_draft' | 'publish' | 'reset') => {
    setBusyAction(action);
    try {
      const payload = action === 'reset' ? { action: 'reset' } : { action, themeConfig: form };
      const res = await api.patch('/settings/theme', payload);
      const updated = res.data.data.settings as WebsiteSettings;
      queryClient.setQueryData(['website-settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
      if (action === 'reset') {
        setDraft(null);
        stopPreview();
        setResetDialogOpen(false);
      } else if (action === 'publish') {
        setDraft(null);
        stopPreview();
      }
      toast.success(res.data.data.message || 'Theme updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const previewRadius = RADIUS_MAP[form.layout.borderRadius] || RADIUS_MAP.rounded;
  const previewScale = FONT_SCALE_MAP[form.typography.baseSizeScale] || '1';
  const previewDisplayFont = FONT_VAR_MAP[form.typography.displayFont] || FONT_VAR_MAP.outfit;
  const previewBodyFont = FONT_VAR_MAP[form.typography.bodyFont] || FONT_VAR_MAP.manrope;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="rounded-theme-card border border-line-subtle bg-surface-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-theme-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-primary">
              Appearance & Theme System
            </h2>
            {settings.themeDraftConfig && (
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                Unpublished Draft Saved
              </span>
            )}
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Configure global Dark & Light tokens, typography, radii, and preview live across SONIQ before publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (isPreviewing ? stopPreview() : startPreview(form))}
          >
            {isPreviewing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {isPreviewing ? 'Exit Preview' : 'Preview Theme'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busyAction !== null}
            onClick={() => submitThemeAction('save_draft')}
          >
            <Save className="h-3.5 w-3.5" />
            {busyAction === 'save_draft' ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busyAction !== null}
            onClick={() => submitThemeAction('publish')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {busyAction === 'publish' ? 'Publishing...' : 'Publish Theme'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={busyAction !== null}
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Controls */}
        <div className="xl:col-span-7 space-y-6">
          {/* Default Mode & Availability */}
          <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
            <h3 className="font-display text-base font-semibold text-ink-primary">
              Theme Availability & Visitor Default
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Default Theme Mode</label>
                <select
                  value={form.defaultTheme}
                  onChange={(e) =>
                    updateForm((p) => ({ ...p, defaultTheme: e.target.value as ThemePreference }))
                  }
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  {form.enableDarkTheme && <option value="dark">Dark (Default)</option>}
                  {form.enableLightTheme && <option value="light">Light</option>}
                  <option value="system">System Preference</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 rounded-theme-control border border-line-subtle bg-surface-secondary px-3.5 py-2.5 text-xs font-medium text-ink-primary cursor-pointer self-end h-10">
                <input
                  type="checkbox"
                  checked={form.enableDarkTheme}
                  onChange={(e) => handleToggleModeEnabled('dark', e.target.checked)}
                  className="accent-[var(--accent-primary)]"
                />
                Enable Dark Theme
              </label>

              <label className="flex items-center gap-2.5 rounded-theme-control border border-line-subtle bg-surface-secondary px-3.5 py-2.5 text-xs font-medium text-ink-primary cursor-pointer self-end h-10">
                <input
                  type="checkbox"
                  checked={form.enableLightTheme}
                  onChange={(e) => handleToggleModeEnabled('light', e.target.checked)}
                  className="accent-[var(--accent-primary)]"
                />
                Enable Light Theme
              </label>
            </div>
          </section>

          {/* Palette Editor */}
          <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-5 shadow-theme-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-primary">Color Palette Tokens</h3>
                <p className="text-xs text-ink-secondary">Accepts hex (#00B8FF) or rgb/rgba color values.</p>
              </div>
              <div className="inline-flex rounded-theme-control border border-line-subtle bg-surface-secondary p-1 self-start">
                <button
                  type="button"
                  onClick={() => setEditingMode('dark')}
                  className={`inline-flex items-center gap-1.5 rounded-theme-control px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    editingMode === 'dark'
                      ? 'bg-btn-primary text-btn-contrast'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark Palette
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMode('light')}
                  className={`inline-flex items-center gap-1.5 rounded-theme-control px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    editingMode === 'light'
                      ? 'bg-btn-primary text-btn-contrast'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light Palette
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PALETTE_FIELDS.map((field) => {
                const value = activePalette[field.key];
                const pickerHex = toPickerHex(value, fallbackHex);
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-xs text-ink-secondary">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={`${field.label} picker`}
                        value={pickerHex}
                        onChange={(e) => updatePaletteField(field.key, e.target.value)}
                        className="h-10 w-11 shrink-0 cursor-pointer rounded-theme-control border border-line-subtle bg-surface-secondary p-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) => updatePaletteField(field.key, e.target.value)}
                        placeholder={DEFAULT_THEME_CONFIG.darkPalette[field.key]}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Typography & Layout */}
          <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
            <h3 className="font-display text-base font-semibold text-ink-primary">
              Typography, Radii & Global Spacing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Display Heading Font</label>
                <select
                  value={form.typography.displayFont}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      typography: { ...p.typography, displayFont: e.target.value as FontChoice },
                    }))
                  }
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  {(Object.keys(FONT_LABELS) as FontChoice[]).map((k) => (
                    <option key={k} value={k}>
                      {FONT_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Body Copy Font</label>
                <select
                  value={form.typography.bodyFont}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      typography: { ...p.typography, bodyFont: e.target.value as FontChoice },
                    }))
                  }
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  {(Object.keys(FONT_LABELS) as FontChoice[]).map((k) => (
                    <option key={k} value={k}>
                      {FONT_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Typography Scale</label>
                <select
                  value={form.typography.baseSizeScale}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      typography: { ...p.typography, baseSizeScale: e.target.value as FontScale },
                    }))
                  }
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  <option value="compact">Compact (94%)</option>
                  <option value="standard">Standard (100%)</option>
                  <option value="large">Editorial Large (106%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Corner Radius</label>
                <select
                  value={form.layout.borderRadius}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      layout: { ...p.layout, borderRadius: e.target.value as RadiusScale },
                    }))
                  }
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  <option value="sharp">Sharp Architectural</option>
                  <option value="medium">Medium</option>
                  <option value="rounded">Rounded Modern (Default)</option>
                  <option value="soft">Soft Curved</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-secondary mb-1.5">Global Section Spacing</label>
                <select
                  value={form.layout.sectionSpacing}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      layout: { ...p.layout, sectionSpacing: e.target.value as SpacingScale },
                    }))
                  }
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  <option value="compact">Compact Vertical Rhythm (3.5rem)</option>
                  <option value="balanced">Balanced Luxury Rhythm (5rem)</option>
                  <option value="spacious">Spacious Gallery Rhythm (6.5rem)</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Embedded Live Preview */}
        <div className="xl:col-span-5 xl:sticky xl:top-24 space-y-4">
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-5 space-y-4 shadow-theme-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Live {editingMode === 'dark' ? 'Dark' : 'Light'} Mode Preview
              </span>
              <span className="text-[11px] font-mono text-accent-primary">
                {form.typography.displayFont} / {form.layout.borderRadius}
              </span>
            </div>

            <div
              style={{
                backgroundColor: activePalette.background,
                color: activePalette.textPrimary,
                borderColor: activePalette.border,
                borderRadius: previewRadius.card,
                fontFamily: previewBodyFont,
                fontSize: `calc(14px * ${previewScale})`,
              }}
              className="border p-5 space-y-5 transition-colors"
            >
              {/* Mini Navbar */}
              <div
                style={{
                  backgroundColor: activePalette.secondaryBackground,
                  borderColor: activePalette.border,
                  borderRadius: previewRadius.control,
                }}
                className="flex items-center justify-between border px-3.5 py-2.5"
              >
                <span
                  style={{ fontFamily: previewDisplayFont }}
                  className="text-sm font-bold tracking-[0.16em]"
                >
                  {settings.siteName || 'SONIQ'}
                </span>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: activePalette.textSecondary }}>
                  <span>Shop</span>
                  <span>Systems</span>
                  <span style={{ color: activePalette.accentPrimary }} className="font-semibold">
                    Bag (2)
                  </span>
                </div>
              </div>

              {/* Mini Hero */}
              <div className="space-y-2.5">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: activePalette.accentPrimary }}
                >
                  {settings.tagline || 'PRECISION ACOUSTICS'}
                </p>
                <h4
                  style={{ fontFamily: previewDisplayFont }}
                  className="text-xl font-bold leading-tight"
                >
                  {settings.heroTitle || 'Experience Sound Beyond Limits.'}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: activePalette.textSecondary }}>
                  Previewing live palette contrast, surface depth, button accents, and corner radii.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    style={{
                      backgroundColor: activePalette.buttonBg,
                      color: activePalette.buttonText,
                      borderRadius: previewRadius.control,
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold"
                  >
                    Explore Collection
                  </span>
                  <span
                    style={{
                      backgroundColor: activePalette.elevatedBackground,
                      color: activePalette.textPrimary,
                      borderColor: activePalette.border,
                      borderRadius: previewRadius.control,
                    }}
                    className="inline-flex items-center border px-3 py-2 text-xs font-medium"
                  >
                    Technology
                  </span>
                </div>
              </div>

              {/* Mini Product Card */}
              <div
                style={{
                  backgroundColor: activePalette.cardBackground,
                  borderColor: activePalette.border,
                  borderRadius: previewRadius.card,
                }}
                className="border p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: activePalette.accentPrimary }}>
                    SONIQ Reference
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: activePalette.textSecondary }}>
                    <Check className="h-3 w-3" style={{ color: activePalette.accentSecondary }} />
                    In Stock
                  </span>
                </div>
                <p style={{ fontFamily: previewDisplayFont }} className="text-sm font-semibold">
                  Monolith X1 Active Tower
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold tabular-nums">$4,290</span>
                  <span
                    style={{
                      backgroundColor: activePalette.buttonBg,
                      color: activePalette.buttonText,
                      borderRadius: previewRadius.control,
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold"
                  >
                    Add to Bag
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Theme to SONIQ Defaults?</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
            This will restore both Dark and Light palettes, typography choices, and border radii to factory SONIQ defaults and discard any unpublished draft.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busyAction === 'reset'}
              onClick={() => submitThemeAction('reset')}
            >
              {busyAction === 'reset' ? 'Resetting...' : 'Confirm Reset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
