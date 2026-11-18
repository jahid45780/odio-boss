import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { settingsSchema } from '@/lib/validations';
import { getWebsiteSettingsSafe } from '@/lib/cms-server';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const settings = getWebsiteSettingsSafe();
    return ok({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const existing = getWebsiteSettingsSafe();
    const body = await req.json();
    const parsed = settingsSchema.partial().parse(body);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE website_settings SET
        siteName = ?, tagline = ?, logoUrl = ?, faviconUrl = ?, contactEmail = ?, contactPhone = ?,
        address = ?, currency = ?, currencySymbol = ?, shippingCharge = ?, freeShippingThreshold = ?,
        announcementText = ?, announcementActive = ?, heroTitle = ?, heroSubtitle = ?, heroImageUrl = ?,
        footerAbout = ?, socialLinksJson = ?, homepageSectionsJson = ?, updatedAt = ?
      WHERE id = 'default'
    `).run(
      parsed.siteName ?? existing.siteName,
      parsed.tagline ?? existing.tagline,
      parsed.logoUrl ?? existing.logoUrl,
      parsed.faviconUrl ?? existing.faviconUrl,
      parsed.contactEmail ?? existing.contactEmail,
      parsed.contactPhone ?? existing.contactPhone,
      parsed.address ?? existing.address,
      parsed.currency ?? existing.currency,
      parsed.currencySymbol ?? existing.currencySymbol,
      parsed.shippingCharge ?? existing.shippingCharge,
      parsed.freeShippingThreshold ?? existing.freeShippingThreshold,
      parsed.announcementText ?? existing.announcementText,
      parsed.announcementActive !== undefined ? (parsed.announcementActive ? 1 : 0) : existing.announcementActive ? 1 : 0,
      parsed.heroTitle ?? existing.heroTitle,
      parsed.heroSubtitle ?? existing.heroSubtitle,
      parsed.heroImageUrl ?? existing.heroImageUrl,
      parsed.footerAbout ?? existing.footerAbout,
      JSON.stringify(parsed.socialLinks ?? existing.socialLinks),
      JSON.stringify(parsed.homepageSections ?? existing.homepageSections),
      now
    );

    if (parsed.navigationConfig) {
      db.prepare('UPDATE navigation_settings SET configJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(parsed.navigationConfig),
        now,
        'default'
      );
    }

    if (parsed.footerConfig) {
      db.prepare('UPDATE footer_settings SET configJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(parsed.footerConfig),
        now,
        'default'
      );
    }

    if (parsed.homepageConfig) {
      db.prepare('UPDATE homepage_sections SET configJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(parsed.homepageConfig),
        now,
        'default'
      );
    }

    if (parsed.themeConfig) {
      db.prepare('UPDATE theme_settings SET publishedConfigJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(parsed.themeConfig),
        now,
        'default'
      );
    }

    return ok({ settings: getWebsiteSettingsSafe() });
  } catch (err) {
    return handleApiError(err);
  }
}
