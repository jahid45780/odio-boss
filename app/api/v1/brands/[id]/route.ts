import { NextRequest } from 'next/server';
import { getDb, slugify } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { brandSchema } from '@/lib/validations';
import { serializeBrand } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return fail('Brand not found', 404);

    const body = await req.json();
    const parsed = brandSchema.partial().parse(body);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE brands SET
        name = ?, slug = ?, description = ?, logoUrl = ?, logoPublicId = ?, isFeatured = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      parsed.name ?? String(existing.name),
      parsed.slug ? slugify(parsed.slug) : parsed.name ? slugify(parsed.name) : String(existing.slug),
      parsed.description ?? String(existing.description ?? ''),
      parsed.logoUrl ?? String(existing.logoUrl ?? ''),
      parsed.logoPublicId ?? String(existing.logoPublicId ?? ''),
      parsed.isFeatured !== undefined ? (parsed.isFeatured ? 1 : 0) : Number(existing.isFeatured),
      now,
      id
    );

    const row = db.prepare('SELECT * FROM brands WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ brand: serializeBrand(row) });
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
    const used = db.prepare('SELECT COUNT(*) as count FROM products WHERE brandId = ?').get(id) as { count: number };
    if (used.count > 0) {
      return fail('Cannot delete brand while products are assigned to it.', 409);
    }

    const res = db.prepare('DELETE FROM brands WHERE id = ?').run(id);
    if (Number(res.changes) === 0) return fail('Brand not found', 404);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
