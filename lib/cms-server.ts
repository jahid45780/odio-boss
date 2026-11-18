import type { Metadata } from 'next';
import { getDb } from './db';
import {
  DEFAULT_PAGES,
  DEFAULT_SEO_SETTINGS,
  DEFAULT_WEBSITE_SETTINGS,
} from './cms-defaults';
import {
  serializePageContent,
  serializeSeoSetting,
  serializeSettings,
} from './serializers';
import type { PageContent, Product, SEOPageSetting, WebsiteSettings } from './types';

export function getSafeSiteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.APP_URL];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      const parsed = new URL(raw.trim());
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // ignore invalid URL candidates and fall through
    }
  }
  return 'http://localhost:3000';
}

export function pickCuratedProducts(
  allProducts: Product[],
  ids: string[],
  fallbackFilter: (p: Product) => boolean
): Product[] {
  if (ids && ids.length > 0) {
    const byId = new Map(allProducts.map((p) => [p.id, p]));
    const picked = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
    if (picked.length > 0) return picked;
  }
  return allProducts.filter(fallbackFilter).slice(0, 6);
}

export function getWebsiteSettingsSafe(): WebsiteSettings {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM website_settings WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined;
    if (!row) return DEFAULT_WEBSITE_SETTINGS;
    const themeRow = db.prepare('SELECT * FROM theme_settings WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined;
    const navRow = db.prepare('SELECT * FROM navigation_settings WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined;
    const footerRow = db.prepare('SELECT * FROM footer_settings WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined;
    const homepageRow = db.prepare('SELECT * FROM homepage_sections WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined;

    return serializeSettings(row, { themeRow, navRow, footerRow, homepageRow });
  } catch {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export function getPageContentSafe(slug: string): PageContent {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM page_contents WHERE slug = ?').get(slug) as
      | Record<string, unknown>
      | undefined;
    if (row) return serializePageContent(row);
  } catch {
    // fallback below
  }
  return DEFAULT_PAGES.find((p) => p.slug === slug) || DEFAULT_PAGES[0];
}

export function getSeoSettingSafe(pageKey: string): SEOPageSetting {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM seo_settings WHERE pageKey = ?').get(pageKey) as
      | Record<string, unknown>
      | undefined;
    if (row) return serializeSeoSetting(row);
    const globalRow = db.prepare('SELECT * FROM seo_settings WHERE pageKey = ?').get('global') as
      | Record<string, unknown>
      | undefined;
    if (globalRow) return serializeSeoSetting(globalRow);
  } catch {
    // fallback below
  }
  return DEFAULT_SEO_SETTINGS.find((s) => s.pageKey === pageKey) || DEFAULT_SEO_SETTINGS[0];
}

export function buildPageMetadata(pageKey: string): Metadata {
  const seo = getSeoSettingSafe(pageKey);
  const globalSeo = getSeoSettingSafe('global');
  const title = seo.metaTitle || globalSeo.metaTitle;
  const description = seo.metaDescription || globalSeo.metaDescription;
  const ogImage = seo.ogImageUrl || globalSeo.ogImageUrl;
  const keywords = (seo.keywords || globalSeo.keywords)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
