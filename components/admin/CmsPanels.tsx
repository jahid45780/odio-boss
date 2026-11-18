'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { DEFAULT_FOOTER_CONFIG, DEFAULT_HOMEPAGE_CONFIG, DEFAULT_NAVIGATION_CONFIG } from '@/lib/cms-defaults';
import type {
  FooterConfig,
  HomepageConfig,
  MediaAsset,
  NavigationConfig,
  PageContent,
  Product,
  SEOPageSetting,
  WebsiteSettings,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { SafeImage } from '@/components/ui/safe-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from './ImageUploader';

interface SettingsTabProps {
  settings: WebsiteSettings;
  onSaved: (next: WebsiteSettings) => void;
}

/* -------------------------------------------------------------------------- */
/* 1. Homepage CMS Panel                                                      */
/* -------------------------------------------------------------------------- */
export function HomepageCmsPanel({ settings, onSaved }: SettingsTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-picker'],
    queryFn: async () =>
      (await api.get('/products', { params: { includeUnpublished: 'false', limit: 100 } })).data.data
        .products as Product[],
  });

  const baseHomepage: HomepageConfig = {
    ...DEFAULT_HOMEPAGE_CONFIG,
    ...(settings.homepageConfig || {}),
    sections:
      settings.homepageConfig?.sections?.length > 0
        ? settings.homepageConfig.sections
        : DEFAULT_HOMEPAGE_CONFIG.sections,
  };

  const [heroDraft, setHeroDraft] = useState<{
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
    homepageConfig: HomepageConfig;
  } | null>(null);

  const form = heroDraft ?? {
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroImageUrl: settings.heroImageUrl,
    homepageConfig: baseHomepage,
  };

  const update = (
    updater: (prev: typeof form) => typeof form
  ) => setHeroDraft((prev) => updater(prev ?? form));

  const toggleProductInList = (
    key: 'featuredProductIds' | 'bestSellerProductIds' | 'newArrivalProductIds',
    productId: string
  ) => {
    update((prev) => {
      const current = prev.homepageConfig[key] || [];
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      return {
        ...prev,
        homepageConfig: { ...prev.homepageConfig, [key]: next },
      };
    });
  };

  const moveSection = (index: number, delta: -1 | 1) => {
    update((prev) => {
      const list = prev.homepageConfig.sections.slice().sort((a, b) => a.sortOrder - b.sortOrder);
      const target = index + delta;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      const renumbered = list.map((sec, idx) => ({ ...sec, sortOrder: idx + 1 }));
      return { ...prev, homepageConfig: { ...prev.homepageConfig, sections: renumbered } };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/settings', form);
      const updated = res.data.data.settings as WebsiteSettings;
      onSaved(updated);
      setHeroDraft(null);
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
      toast.success('Homepage content & layout published');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const orderedSections = form.homepageConfig.sections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <h2 className="font-display text-lg font-semibold text-ink-primary">Hero Section & Call-To-Actions</h2>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Hero Headline</label>
          <Input
            required
            value={form.heroTitle}
            onChange={(e) => update((p) => ({ ...p, heroTitle: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Hero Subheadline</label>
          <Textarea
            required
            value={form.heroSubtitle}
            onChange={(e) => update((p) => ({ ...p, heroSubtitle: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Primary CTA Label</label>
            <Input
              required
              value={form.homepageConfig.heroPrimaryCtaText}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  homepageConfig: { ...p.homepageConfig, heroPrimaryCtaText: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Primary CTA URL</label>
            <Input
              required
              value={form.homepageConfig.heroPrimaryCtaUrl}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  homepageConfig: { ...p.homepageConfig, heroPrimaryCtaUrl: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Secondary CTA Label</label>
            <Input
              value={form.homepageConfig.heroSecondaryCtaText}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  homepageConfig: { ...p.homepageConfig, heroSecondaryCtaText: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Secondary CTA URL</label>
            <Input
              value={form.homepageConfig.heroSecondaryCtaUrl}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  homepageConfig: { ...p.homepageConfig, heroSecondaryCtaUrl: e.target.value },
                }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs text-ink-secondary mb-2">Hero Featured Speaker Image</label>
            <ImageUploader
              folder="soniq/hero"
              label="Replace Hero Visual"
              value={form.heroImageUrl ? [form.heroImageUrl] : []}
              onChange={(urls) => update((p) => ({ ...p, heroImageUrl: urls[0] || '/images/hero-flagship.jpg' }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-2">Hero Ambient Background Image (Optional)</label>
            <ImageUploader
              folder="soniq/backgrounds"
              label="Upload Background Texture"
              value={form.homepageConfig.heroBackgroundImageUrl ? [form.homepageConfig.heroBackgroundImageUrl] : []}
              onChange={(urls) =>
                update((p) => ({
                  ...p,
                  homepageConfig: { ...p.homepageConfig, heroBackgroundImageUrl: urls[0] || '' },
                }))
              }
            />
          </div>
        </div>
      </section>

      {/* Curated Product Pickers */}
      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-5 shadow-theme-card">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-primary">Curated Homepage Product Tabs</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Select specific speakers for each collection tab. Leave empty to use automatic catalog flags.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(
            [
              { key: 'featuredProductIds', title: 'Featured Speakers' },
              { key: 'bestSellerProductIds', title: 'Best Sellers' },
              { key: 'newArrivalProductIds', title: 'New Arrivals' },
            ] as const
          ).map((col) => {
            const selectedIds = form.homepageConfig[col.key] || [];
            return (
              <div
                key={col.key}
                className="rounded-theme-control border border-line-subtle bg-surface-secondary p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-primary">{col.title}</span>
                  <span className="text-[11px] font-mono text-accent-primary tabular-nums">
                    {selectedIds.length > 0 ? `${selectedIds.length} pinned` : 'Auto'}
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {products.map((prod) => (
                    <label
                      key={prod.id}
                      className="flex items-center gap-2 text-xs text-ink-secondary hover:text-ink-primary cursor-pointer py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(prod.id)}
                        onChange={() => toggleProductInList(col.key, prod.id)}
                        className="accent-[var(--accent-primary)]"
                      />
                      <span className="truncate">{prod.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section Ordering & Copy */}
      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-primary">Homepage Sections Order & Copy</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Reorder homepage bands, toggle visibility, and customize each section heading.
          </p>
        </div>

        <div className="space-y-3">
          {orderedSections.map((sec, idx) => (
            <div
              key={sec.key}
              className="rounded-theme-control border border-line-subtle bg-surface-secondary p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-accent-primary">#{idx + 1}</span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sec.isVisible}
                      onChange={(e) =>
                        update((p) => ({
                          ...p,
                          homepageConfig: {
                            ...p.homepageConfig,
                            sections: p.homepageConfig.sections.map((s) =>
                              s.key === sec.key ? { ...s, isVisible: e.target.checked } : s
                            ),
                          },
                        }))
                      }
                      className="accent-[var(--accent-primary)]"
                    />
                    {sec.key} ({sec.isVisible ? 'Visible' : 'Hidden'})
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, -1)}
                    aria-label="Move section up"
                    className="p-1.5 rounded text-ink-secondary hover:text-ink-primary disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === orderedSections.length - 1}
                    onClick={() => moveSection(idx, 1)}
                    aria-label="Move section down"
                    className="p-1.5 rounded text-ink-secondary hover:text-ink-primary disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Eyebrow"
                  value={sec.eyebrow}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      homepageConfig: {
                        ...p.homepageConfig,
                        sections: p.homepageConfig.sections.map((s) =>
                          s.key === sec.key ? { ...s, eyebrow: e.target.value } : s
                        ),
                      },
                    }))
                  }
                />
                <Input
                  placeholder="Section Title"
                  value={sec.title}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      homepageConfig: {
                        ...p.homepageConfig,
                        sections: p.homepageConfig.sections.map((s) =>
                          s.key === sec.key ? { ...s, title: e.target.value } : s
                        ),
                      },
                    }))
                  }
                />
              </div>
              <Input
                placeholder="Section Description"
                value={sec.description}
                onChange={(e) =>
                  update((p) => ({
                    ...p,
                    homepageConfig: {
                      ...p.homepageConfig,
                      sections: p.homepageConfig.sections.map((s) =>
                        s.key === sec.key ? { ...s, description: e.target.value } : s
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Saving Homepage...' : 'Save Homepage Configuration'}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Navigation & Brand Identity Panel                                       */
/* -------------------------------------------------------------------------- */
export function NavigationCmsPanel({ settings, onSaved }: SettingsTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const baseNav: NavigationConfig = {
    ...DEFAULT_NAVIGATION_CONFIG,
    ...(settings.navigationConfig || {}),
    links:
      settings.navigationConfig?.links?.length > 0
        ? settings.navigationConfig.links
        : DEFAULT_NAVIGATION_CONFIG.links,
  };

  const [navDraft, setNavDraft] = useState<{
    siteName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    announcementText: string;
    announcementActive: boolean;
    navigationConfig: NavigationConfig;
  } | null>(null);

  const form = navDraft ?? {
    siteName: settings.siteName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    announcementText: settings.announcementText,
    announcementActive: settings.announcementActive,
    navigationConfig: baseNav,
  };

  const update = (updater: (prev: typeof form) => typeof form) =>
    setNavDraft((prev) => updater(prev ?? form));

  const moveLink = (idx: number, delta: -1 | 1) => {
    update((prev) => {
      const list = prev.navigationConfig.links.slice().sort((a, b) => a.sortOrder - b.sortOrder);
      const target = idx + delta;
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return {
        ...prev,
        navigationConfig: {
          ...prev.navigationConfig,
          links: list.map((l, i) => ({ ...l, sortOrder: i + 1 })),
        },
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/settings', form);
      onSaved(res.data.data.settings as WebsiteSettings);
      setNavDraft(null);
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
      toast.success('Navigation & header settings saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const sortedLinks = form.navigationConfig.links
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <h2 className="font-display text-lg font-semibold text-ink-primary">Brand Wordmark, Logo & Announcement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Website Name</label>
            <Input
              required
              value={form.siteName}
              onChange={(e) => update((p) => ({ ...p, siteName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Tagline</label>
            <Input
              required
              value={form.tagline}
              onChange={(e) => update((p) => ({ ...p, tagline: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-ink-secondary mb-2">Brand Logo Image (Optional)</label>
            <ImageUploader
              folder="soniq/logo"
              label="Upload Logo"
              value={form.logoUrl ? [form.logoUrl] : []}
              onChange={(urls) => update((p) => ({ ...p, logoUrl: urls[0] || '' }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-2">Favicon URL / Upload (Optional)</label>
            <ImageUploader
              folder="soniq/logo"
              label="Upload Favicon"
              value={form.faviconUrl ? [form.faviconUrl] : []}
              onChange={(urls) => update((p) => ({ ...p, faviconUrl: urls[0] || '' }))}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-line-subtle space-y-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Announcement Bar Copy</label>
            <Input
              value={form.announcementText}
              onChange={(e) => update((p) => ({ ...p, announcementText: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.announcementActive}
              onChange={(e) => update((p) => ({ ...p, announcementActive: e.target.checked }))}
              className="accent-[var(--accent-primary)]"
            />
            Display Announcement Bar above Header
          </label>
        </div>
      </section>

      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-ink-primary">Header Appearance & Menu Links</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              update((p) => ({
                ...p,
                navigationConfig: {
                  ...p.navigationConfig,
                  links: [
                    ...p.navigationConfig.links,
                    {
                      id: `nav_${Date.now()}`,
                      label: 'New Link',
                      href: '/shop',
                      isVisible: true,
                      sortOrder: p.navigationConfig.links.length + 1,
                    },
                  ],
                },
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Menu Link
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Header Surface Style</label>
            <select
              value={form.navigationConfig.headerStyle}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  navigationConfig: {
                    ...p.navigationConfig,
                    headerStyle: e.target.value as 'blur' | 'solid' | 'transparent',
                  },
                }))
              }
              className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="blur">Frosted Glass Blur</option>
              <option value="solid">Solid Surface</option>
              <option value="transparent">Transparent</option>
            </select>
          </div>
          <label className="flex items-center gap-2.5 text-xs font-medium text-ink-primary cursor-pointer self-end h-10">
            <input
              type="checkbox"
              checked={form.navigationConfig.stickyHeader}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  navigationConfig: { ...p.navigationConfig, stickyHeader: e.target.checked },
                }))
              }
              className="accent-[var(--accent-primary)]"
            />
            Sticky Top Navigation
          </label>
        </div>

        <div className="space-y-2.5">
          {sortedLinks.map((link, idx) => (
            <div
              key={link.id}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-theme-control border border-line-subtle bg-surface-secondary p-3"
            >
              <input
                type="checkbox"
                checked={link.isVisible}
                onChange={(e) =>
                  update((p) => ({
                    ...p,
                    navigationConfig: {
                      ...p.navigationConfig,
                      links: p.navigationConfig.links.map((l) =>
                        l.id === link.id ? { ...l, isVisible: e.target.checked } : l
                      ),
                    },
                  }))
                }
                aria-label={`Toggle ${link.label} visibility`}
                className="accent-[var(--accent-primary)]"
              />
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) =>
                  update((p) => ({
                    ...p,
                    navigationConfig: {
                      ...p.navigationConfig,
                      links: p.navigationConfig.links.map((l) =>
                        l.id === link.id ? { ...l, label: e.target.value } : l
                      ),
                    },
                  }))
                }
              />
              <Input
                placeholder="/shop"
                value={link.href}
                onChange={(e) =>
                  update((p) => ({
                    ...p,
                    navigationConfig: {
                      ...p.navigationConfig,
                      links: p.navigationConfig.links.map((l) =>
                        l.id === link.id ? { ...l, href: e.target.value } : l
                      ),
                    },
                  }))
                }
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveLink(idx, -1)}
                  className="p-1.5 text-ink-secondary hover:text-ink-primary disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === sortedLinks.length - 1}
                  onClick={() => moveLink(idx, 1)}
                  className="p-1.5 text-ink-secondary hover:text-ink-primary disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      navigationConfig: {
                        ...p.navigationConfig,
                        links: p.navigationConfig.links.filter((l) => l.id !== link.id),
                      },
                    }))
                  }
                  className="p-1.5 text-ink-secondary hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Saving Navigation...' : 'Save Navigation & Brand'}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Footer, Contact & General Commerce Panel                                */
/* -------------------------------------------------------------------------- */
export function FooterGeneralCmsPanel({ settings, onSaved }: SettingsTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const baseFooter: FooterConfig = {
    ...DEFAULT_FOOTER_CONFIG,
    ...(settings.footerConfig || {}),
    columns:
      settings.footerConfig?.columns?.length > 0
        ? settings.footerConfig.columns
        : DEFAULT_FOOTER_CONFIG.columns,
  };

  const [footerDraft, setFooterDraft] = useState<{
    contactEmail: string;
    contactPhone: string;
    address: string;
    currency: string;
    currencySymbol: string;
    shippingCharge: number;
    freeShippingThreshold: number;
    footerAbout: string;
    socialLinks: Record<string, string>;
    footerConfig: FooterConfig;
  } | null>(null);

  const form = footerDraft ?? {
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    address: settings.address,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    shippingCharge: settings.shippingCharge,
    freeShippingThreshold: settings.freeShippingThreshold,
    footerAbout: settings.footerAbout,
    socialLinks: settings.socialLinks || {},
    footerConfig: baseFooter,
  };

  const update = (updater: (prev: typeof form) => typeof form) =>
    setFooterDraft((prev) => updater(prev ?? form));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/settings', form);
      onSaved(res.data.data.settings as WebsiteSettings);
      setFooterDraft(null);
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
      toast.success('Footer, contact & commerce settings saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <h2 className="font-display text-lg font-semibold text-ink-primary">Contact Info, Currency & Shipping</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Contact Email</label>
            <Input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => update((p) => ({ ...p, contactEmail: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Phone Number</label>
            <Input
              required
              value={form.contactPhone}
              onChange={(e) => update((p) => ({ ...p, contactPhone: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Flagship Showroom Address</label>
          <Input
            required
            value={form.address}
            onChange={(e) => update((p) => ({ ...p, address: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Currency Code</label>
            <Input
              required
              value={form.currency}
              onChange={(e) => update((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Symbol</label>
            <Input
              required
              value={form.currencySymbol}
              onChange={(e) => update((p) => ({ ...p, currencySymbol: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Flat Shipping</label>
            <Input
              type="number"
              step="0.01"
              required
              value={form.shippingCharge}
              onChange={(e) => update((p) => ({ ...p, shippingCharge: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Free Shipping Over</label>
            <Input
              type="number"
              step="0.01"
              required
              value={form.freeShippingThreshold}
              onChange={(e) => update((p) => ({ ...p, freeShippingThreshold: Number(e.target.value) }))}
            />
          </div>
        </div>
      </section>

      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <h2 className="font-display text-lg font-semibold text-ink-primary">Footer Copy, Social Links & Newsletter</h2>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Footer Brand Summary</label>
          <Textarea
            required
            value={form.footerAbout}
            onChange={(e) => update((p) => ({ ...p, footerAbout: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">
              Copyright Template (supports {'{year}'} & {'{siteName}'})
            </label>
            <Input
              required
              value={form.footerConfig.copyrightText}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  footerConfig: { ...p.footerConfig, copyrightText: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Newsletter CTA Button</label>
            <Input
              value={form.footerConfig.newsletterButtonText}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  footerConfig: { ...p.footerConfig, newsletterButtonText: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Newsletter Eyebrow</label>
            <Input
              value={form.footerConfig.newsletterEyebrow}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  footerConfig: { ...p.footerConfig, newsletterEyebrow: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Newsletter Title</label>
            <Input
              value={form.footerConfig.newsletterTitle}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  footerConfig: { ...p.footerConfig, newsletterTitle: e.target.value },
                }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {(['instagram', 'youtube', 'x', 'linkedin'] as const).map((net) => (
            <div key={net}>
              <label className="block text-xs text-ink-secondary mb-1 capitalize">{net} URL</label>
              <Input
                value={form.socialLinks?.[net] || ''}
                onChange={(e) =>
                  update((p) => ({
                    ...p,
                    socialLinks: { ...p.socialLinks, [net]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-primary">Footer Navigation Columns</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              update((p) => ({
                ...p,
                footerConfig: {
                  ...p.footerConfig,
                  columns: [
                    ...p.footerConfig.columns,
                    { id: `col_${Date.now()}`, title: 'New Column', links: [{ label: 'Shop', href: '/shop' }] },
                  ],
                },
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Column
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {form.footerConfig.columns.map((col) => (
            <div
              key={col.id}
              className="rounded-theme-control border border-line-subtle bg-surface-secondary p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={col.title}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      footerConfig: {
                        ...p.footerConfig,
                        columns: p.footerConfig.columns.map((c) =>
                          c.id === col.id ? { ...c, title: e.target.value } : c
                        ),
                      },
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      footerConfig: {
                        ...p.footerConfig,
                        columns: p.footerConfig.columns.filter((c) => c.id !== col.id),
                      },
                    }))
                  }
                  className="p-1.5 text-ink-secondary hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {col.links.map((lnk, lIdx) => (
                  <div key={lIdx} className="flex gap-1.5 items-center">
                    <Input
                      placeholder="Label"
                      value={lnk.label}
                      onChange={(e) =>
                        update((p) => ({
                          ...p,
                          footerConfig: {
                            ...p.footerConfig,
                            columns: p.footerConfig.columns.map((c) =>
                              c.id === col.id
                                ? {
                                    ...c,
                                    links: c.links.map((item, i) =>
                                      i === lIdx ? { ...item, label: e.target.value } : item
                                    ),
                                  }
                                : c
                            ),
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="/href"
                      value={lnk.href}
                      onChange={(e) =>
                        update((p) => ({
                          ...p,
                          footerConfig: {
                            ...p.footerConfig,
                            columns: p.footerConfig.columns.map((c) =>
                              c.id === col.id
                                ? {
                                    ...c,
                                    links: c.links.map((item, i) =>
                                      i === lIdx ? { ...item, href: e.target.value } : item
                                    ),
                                  }
                                : c
                            ),
                          },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          footerConfig: {
                            ...p.footerConfig,
                            columns: p.footerConfig.columns.map((c) =>
                              c.id === col.id
                                ? { ...c, links: c.links.filter((_, i) => i !== lIdx) }
                                : c
                            ),
                          },
                        }))
                      }
                      className="p-1 text-ink-secondary hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  update((p) => ({
                    ...p,
                    footerConfig: {
                      ...p.footerConfig,
                      columns: p.footerConfig.columns.map((c) =>
                        c.id === col.id ? { ...c, links: [...c.links, { label: 'Link', href: '/' }] } : c
                      ),
                    },
                  }))
                }
                className="text-xs text-accent-primary hover:underline cursor-pointer"
              >
                + Add Link
              </button>
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Saving Footer...' : 'Save Footer & Store Settings'}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Static Pages CMS Panel                                                  */
/* -------------------------------------------------------------------------- */
export function StaticPagesCmsPanel() {
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState('about');
  const [saving, setSaving] = useState(false);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: async () => (await api.get('/settings/pages')).data.data.pages as PageContent[],
  });

  const [draftBySlug, setDraftBySlug] = useState<Record<string, PageContent>>({});
  const currentServer = pages.find((p) => p.slug === selectedSlug) || pages[0];
  const form = (selectedSlug && draftBySlug[selectedSlug]) || currentServer;

  const updateForm = (updater: (prev: PageContent) => PageContent) => {
    if (!form) return;
    setDraftBySlug((prev) => ({ ...prev, [form.slug]: updater(prev[form.slug] || form) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await api.put('/settings/pages', form);
      const updated = res.data.data.page as PageContent;
      queryClient.setQueryData(['cms-pages'], (old: PageContent[] | undefined) =>
        (old || []).map((p) => (p.slug === updated.slug ? updated : p))
      );
      setDraftBySlug((prev) => {
        const next = { ...prev };
        delete next[updated.slug];
        return next;
      });
      toast.success(`Saved /${updated.slug} content`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form) {
    return <div className="text-sm text-ink-secondary">Loading static page records...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-3 rounded-theme-card border border-line-subtle bg-surface-card p-3 space-y-1 shadow-theme-card">
        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
          Storefront Pages
        </p>
        {pages.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSelectedSlug(p.slug)}
            className={`w-full text-left rounded-theme-control px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              selectedSlug === p.slug
                ? 'bg-accent-primary/15 text-accent-primary'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
            }`}
          >
            /{p.slug}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSave}
        className="lg:col-span-9 rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-5 shadow-theme-card"
      >
        <div className="flex items-center justify-between border-b border-line-subtle pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-primary">Edit /{form.slug}</h2>
            <p className="text-xs text-ink-secondary">Changes apply live to the customer-facing page.</p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Publish Page'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Eyebrow Label</label>
            <Input
              value={form.eyebrow}
              onChange={(e) => updateForm((p) => ({ ...p, eyebrow: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Page Title</label>
            <Input
              required
              value={form.title}
              onChange={(e) => updateForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-secondary mb-1">Subtitle / Intro Paragraph</label>
          <Textarea
            rows={3}
            value={form.subtitle}
            onChange={(e) => updateForm((p) => ({ ...p, subtitle: e.target.value }))}
          />
        </div>

        {form.slug === 'about' && (
          <div>
            <label className="block text-xs text-ink-secondary mb-2">Studio Feature Image</label>
            <ImageUploader
              folder="soniq/pages"
              label="Replace Feature Image"
              value={form.heroImageUrl ? [form.heroImageUrl] : []}
              onChange={(urls) => updateForm((p) => ({ ...p, heroImageUrl: urls[0] || '' }))}
            />
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-3 pt-2 border-t border-line-subtle">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-primary">Body Content Sections</label>
            <button
              type="button"
              onClick={() =>
                updateForm((p) => ({
                  ...p,
                  sections: [...p.sections, { heading: 'New Section', body: '' }],
                }))
              }
              className="text-xs text-accent-primary hover:underline cursor-pointer"
            >
              + Add Section
            </button>
          </div>
          {form.sections.map((sec, idx) => (
            <div
              key={idx}
              className="rounded-theme-control border border-line-subtle bg-surface-secondary p-4 space-y-2.5"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Section Heading"
                  value={sec.heading}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      sections: p.sections.map((s, i) => (i === idx ? { ...s, heading: e.target.value } : s)),
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    updateForm((p) => ({
                      ...p,
                      sections: p.sections.filter((_, i) => i !== idx),
                    }))
                  }
                  className="p-2 text-ink-secondary hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                rows={3}
                placeholder="Section body..."
                value={sec.body}
                onChange={(e) =>
                  updateForm((p) => ({
                    ...p,
                    sections: p.sections.map((s, i) => (i === idx ? { ...s, body: e.target.value } : s)),
                  }))
                }
              />
            </div>
          ))}
        </div>

        {/* FAQ Items (for FAQ or any page) */}
        {(form.slug === 'faq' || form.faqItems.length > 0) && (
          <div className="space-y-3 pt-2 border-t border-line-subtle">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-primary">FAQ Entries</label>
              <button
                type="button"
                onClick={() =>
                  updateForm((p) => ({
                    ...p,
                    faqItems: [...p.faqItems, { question: '', answer: '' }],
                  }))
                }
                className="text-xs text-accent-primary hover:underline cursor-pointer"
              >
                + Add FAQ Item
              </button>
            </div>
            {form.faqItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-theme-control border border-line-subtle bg-surface-secondary p-4 space-y-2.5"
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Question"
                    value={item.question}
                    onChange={(e) =>
                      updateForm((p) => ({
                        ...p,
                        faqItems: p.faqItems.map((q, i) => (i === idx ? { ...q, question: e.target.value } : q)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateForm((p) => ({
                        ...p,
                        faqItems: p.faqItems.filter((_, i) => i !== idx),
                      }))
                    }
                    className="p-2 text-ink-secondary hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) =>
                    updateForm((p) => ({
                      ...p,
                      faqItems: p.faqItems.map((q, i) => (i === idx ? { ...q, answer: e.target.value } : q)),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. SEO Manager Panel                                                       */
/* -------------------------------------------------------------------------- */
export function SeoManagerPanel() {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState('global');
  const [saving, setSaving] = useState(false);

  const { data: seoList = [], isLoading } = useQuery({
    queryKey: ['cms-seo'],
    queryFn: async () => (await api.get('/settings/seo')).data.data.seoSettings as SEOPageSetting[],
  });

  const [drafts, setDrafts] = useState<Record<string, SEOPageSetting>>({});
  const currentServer = seoList.find((s) => s.pageKey === selectedKey) || seoList[0];
  const form = (selectedKey && drafts[selectedKey]) || currentServer;

  const updateForm = (updater: (prev: SEOPageSetting) => SEOPageSetting) => {
    if (!form) return;
    setDrafts((prev) => ({ ...prev, [form.pageKey]: updater(prev[form.pageKey] || form) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await api.put('/settings/seo', form);
      const updated = res.data.data.seo as SEOPageSetting;
      queryClient.setQueryData(['cms-seo'], (old: SEOPageSetting[] | undefined) =>
        (old || []).map((s) => (s.pageKey === updated.pageKey ? updated : s))
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[updated.pageKey];
        return next;
      });
      toast.success(`SEO metadata saved for ${updated.label}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form) {
    return <div className="text-sm text-ink-secondary">Loading SEO configuration...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-3 rounded-theme-card border border-line-subtle bg-surface-card p-3 space-y-1 shadow-theme-card">
        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
          SEO Targets
        </p>
        {seoList.map((item) => (
          <button
            key={item.pageKey}
            type="button"
            onClick={() => setSelectedKey(item.pageKey)}
            className={`w-full text-left rounded-theme-control px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              selectedKey === item.pageKey
                ? 'bg-accent-primary/15 text-accent-primary'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSave}
        className="lg:col-span-9 rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-5 shadow-theme-card"
      >
        <div className="flex items-center justify-between border-b border-line-subtle pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-primary">{form.label} SEO</h2>
            <p className="text-xs text-ink-secondary">Controls HTML title, meta description, keywords, and OpenGraph cards.</p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save SEO Metadata'}
          </Button>
        </div>

        <div>
          <label className="block text-xs text-ink-secondary mb-1">Meta Title</label>
          <Input
            required
            value={form.metaTitle}
            onChange={(e) => updateForm((p) => ({ ...p, metaTitle: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Meta Description</label>
          <Textarea
            rows={3}
            value={form.metaDescription}
            onChange={(e) => updateForm((p) => ({ ...p, metaDescription: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Keywords (comma-separated)</label>
          <Input
            value={form.keywords}
            onChange={(e) => updateForm((p) => ({ ...p, keywords: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-2">OpenGraph Share Image</label>
          <ImageUploader
            folder="soniq/seo"
            label="Upload OG Social Image"
            value={form.ogImageUrl ? [form.ogImageUrl] : []}
            onChange={(urls) => updateForm((p) => ({ ...p, ogImageUrl: urls[0] || '' }))}
          />
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Media Library Manager Panel                                             */
/* -------------------------------------------------------------------------- */
export function MediaManagerPanel() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadCategory, setUploadCategory] = useState<MediaAsset['category']>('general');
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaAsset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const newFileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<MediaAsset | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['media-assets', categoryFilter],
    queryFn: async () =>
      (await api.get('/media', { params: { category: categoryFilter } })).data.data.assets as MediaAsset[],
  });

  const handleUploadNew = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', uploadCategory);
      fd.append('label', uploadLabel.trim() || file.name);
      await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadLabel('');
      toast.success('Media asset added to library');
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (newFileRef.current) newFileRef.current.value = '';
    }
  };

  const handleReplaceFile = async (file: File | undefined) => {
    const target = replaceTargetRef.current;
    if (!file || !target) return;
    setReplacingId(target.id);
    try {
      const fd = new FormData();
      fd.append('id', target.id);
      fd.append('category', target.category);
      fd.append('file', file);
      await api.patch('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Media asset replaced and linked references updated');
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['website-settings'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setReplacingId(null);
      replaceTargetRef.current = null;
      if (replaceFileRef.current) replaceFileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/media/${confirmDelete.id}`);
      toast.success('Media asset removed');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const copyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopiedId((id) => (id === asset.id ? null : id)), 1500);
    } catch {
      toast.error('Unable to copy URL');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-theme-card border border-line-subtle bg-surface-card p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 shadow-theme-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Asset Label</label>
            <Input
              placeholder="e.g. Hero Monolith Banner"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as MediaAsset['category'])}
              className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="logo">Logo / Brand</option>
              <option value="banner">Hero / Banner</option>
              <option value="background">Background Texture</option>
              <option value="product">Product Photo</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="flex items-end">
            <input
              ref={newFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => handleUploadNew(e.target.files?.[0])}
            />
            <Button
              type="button"
              className="w-full"
              disabled={uploading}
              onClick={() => newFileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Upload New Asset'}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-secondary mb-1">Filter Library</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="logo">Logos</option>
            <option value="banner">Banners</option>
            <option value="background">Backgrounds</option>
            <option value="product">Products</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      <input
        ref={replaceFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleReplaceFile(e.target.files?.[0])}
      />

      {isLoading ? (
        <div className="text-sm text-ink-secondary py-12 text-center">Loading media assets...</div>
      ) : assets.length === 0 ? (
        <div className="rounded-theme-card border border-line-subtle bg-surface-card p-10 text-center text-sm text-ink-secondary">
          No assets in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden flex flex-col shadow-theme-card"
            >
              <div className="relative h-40 bg-surface-elevated">
                <SafeImage src={asset.url} alt={asset.label} fill className="object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-accent-primary font-medium">
                    <span>{asset.category}</span>
                    <span className="font-mono text-ink-secondary">{asset.provider}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink-primary truncate">{asset.label}</p>
                  <p className="mt-0.5 text-[11px] font-mono text-ink-secondary truncate">{asset.url}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-line-subtle">
                  <Button type="button" size="sm" variant="secondary" onClick={() => copyUrl(asset)}>
                    {copiedId === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy URL
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={replacingId === asset.id}
                      onClick={() => {
                        replaceTargetRef.current = asset;
                        replaceFileRef.current?.click();
                      }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${replacingId === asset.id ? 'animate-spin' : ''}`} />
                      Replace
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(asset)}
                      aria-label={`Delete ${asset.label}`}
                      className="p-2 text-ink-secondary hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Media Asset?</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-ink-secondary">
            Remove <strong className="text-ink-primary">{confirmDelete?.label}</strong> from the media library? Any page or product referencing this URL should be updated.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Asset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
