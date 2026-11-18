import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { bannerSchema } from '@/lib/validations';
import { serializeBanner } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return fail('Banner not found', 404);

    const body = await req.json();
    const parsed = bannerSchema.partial().parse(body);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE banners SET
        title = ?, subtitle = ?, ctaText = ?, ctaLink = ?, imageUrl = ?, imagePublicId = ?,
        placement = ?, displayOrder = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      parsed.title ?? String(existing.title),
      parsed.subtitle ?? String(existing.subtitle ?? ''),
      parsed.ctaText ?? String(existing.ctaText ?? 'Explore Collection'),
      parsed.ctaLink ?? String(existing.ctaLink ?? '/shop'),
      parsed.imageUrl ?? String(existing.imageUrl),
      parsed.imagePublicId ?? String(existing.imagePublicId ?? ''),
      parsed.placement ?? String(existing.placement ?? 'PROMO'),
      parsed.displayOrder !== undefined ? parsed.displayOrder : Number(existing.displayOrder),
      parsed.isActive !== undefined ? (parsed.isActive ? 1 : 0) : Number(existing.isActive),
      now,
      id
    );

    const row = db.prepare('SELECT * FROM banners WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ banner: serializeBanner(row) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const res = db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    if (Number(res.changes) === 0) return fail('Banner not found', 404);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
