import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { pageContentSchema } from '@/lib/validations';
import { serializePageContent } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const slug = req.nextUrl.searchParams.get('slug');
    if (slug) {
      const row = db.prepare('SELECT * FROM page_contents WHERE slug = ?').get(slug) as
        | Record<string, unknown>
        | undefined;
      if (!row) return fail('Page content not found', 404);
      return ok({ page: serializePageContent(row) });
    }
    const pages = db.prepare('SELECT * FROM page_contents ORDER BY slug ASC').all().map(serializePageContent);
    return ok({ pages });
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
    const parsed = pageContentSchema.parse(body);
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO page_contents (slug, eyebrow, title, subtitle, heroImageUrl, sectionsJson, faqItemsJson, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        eyebrow = excluded.eyebrow,
        title = excluded.title,
        subtitle = excluded.subtitle,
        heroImageUrl = excluded.heroImageUrl,
        sectionsJson = excluded.sectionsJson,
        faqItemsJson = excluded.faqItemsJson,
        updatedAt = excluded.updatedAt
    `).run(
      parsed.slug,
      parsed.eyebrow,
      parsed.title,
      parsed.subtitle,
      parsed.heroImageUrl,
      JSON.stringify(parsed.sections),
      JSON.stringify(parsed.faqItems),
      now
    );

    const updated = db.prepare('SELECT * FROM page_contents WHERE slug = ?').get(parsed.slug) as Record<string, unknown>;
    return ok({ page: serializePageContent(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
