import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { seoPageSchema } from '@/lib/validations';
import { serializeSeoSetting } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const pageKey = req.nextUrl.searchParams.get('pageKey');
    if (pageKey) {
      const row = db.prepare('SELECT * FROM seo_settings WHERE pageKey = ?').get(pageKey) as
        | Record<string, unknown>
        | undefined;
      if (!row) return fail('SEO setting not found', 404);
      return ok({ seo: serializeSeoSetting(row) });
    }
    const items = db.prepare('SELECT * FROM seo_settings ORDER BY pageKey ASC').all().map(serializeSeoSetting);
    return ok({ seoSettings: items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const body = await req.json();
    const parsed = seoPageSchema.parse(body);
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO seo_settings (pageKey, label, metaTitle, metaDescription, keywords, ogImageUrl, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(pageKey) DO UPDATE SET
        label = excluded.label,
        metaTitle = excluded.metaTitle,
        metaDescription = excluded.metaDescription,
        keywords = excluded.keywords,
        ogImageUrl = excluded.ogImageUrl,
        updatedAt = excluded.updatedAt
    `).run(
      parsed.pageKey,
      parsed.label,
      parsed.metaTitle,
      parsed.metaDescription,
      parsed.keywords,
      parsed.ogImageUrl,
      now
    );

    const updated = db.prepare('SELECT * FROM seo_settings WHERE pageKey = ?').get(parsed.pageKey) as Record<
      string,
      unknown
    >;
    return ok({ seo: serializeSeoSetting(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
