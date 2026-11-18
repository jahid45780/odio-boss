import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { bannerSchema } from '@/lib/validations';
import { serializeBanner } from '@/lib/serializers';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true';
    let showAll = false;
    if (includeInactive) {
      const user = await getSessionUser();
      if (user?.role === 'ADMIN') showAll = true;
    }

    const rows = db
      .prepare(`SELECT * FROM banners ${showAll ? '' : 'WHERE isActive = 1'} ORDER BY displayOrder ASC, createdAt DESC`)
      .all();

    return ok({ banners: rows.map(serializeBanner) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const body = await req.json();
    const parsed = bannerSchema.parse(body);
    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO banners (id, title, subtitle, ctaText, ctaLink, imageUrl, imagePublicId, placement, displayOrder, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.title,
      parsed.subtitle || '',
      parsed.ctaText || 'Explore Collection',
      parsed.ctaLink || '/shop',
      parsed.imageUrl,
      parsed.imagePublicId || '',
      parsed.placement || 'PROMO',
      parsed.displayOrder ?? 0,
      parsed.isActive ? 1 : 0,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM banners WHERE id = ?').get(id) as Record<string, unknown>;
    return created({ banner: serializeBanner(row) });
  } catch (err) {
    return handleApiError(err);
  }
}
