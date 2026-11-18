import { NextRequest } from 'next/server';
import { getDb, slugify } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';
import { serializeCategory } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return fail('Category not found', 404);

    const body = await req.json();
    const parsed = categorySchema.partial().parse(body);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE categories SET
        name = ?, slug = ?, description = ?, imageUrl = ?, imagePublicId = ?, isActive = ?, sortOrder = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      parsed.name ?? String(existing.name),
      parsed.slug ? slugify(parsed.slug) : parsed.name ? slugify(parsed.name) : String(existing.slug),
      parsed.description ?? String(existing.description ?? ''),
      parsed.imageUrl ?? String(existing.imageUrl ?? ''),
      parsed.imagePublicId ?? String(existing.imagePublicId ?? ''),
      parsed.isActive !== undefined ? (parsed.isActive ? 1 : 0) : Number(existing.isActive),
      parsed.sortOrder !== undefined ? parsed.sortOrder : Number(existing.sortOrder),
      now,
      id
    );

    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ category: serializeCategory(row) });
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
    const used = db.prepare('SELECT COUNT(*) as count FROM products WHERE categoryId = ?').get(id) as { count: number };
    if (used.count > 0) {
      return fail('Cannot delete category while products are assigned to it.', 409);
    }

    const res = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (Number(res.changes) === 0) return fail('Category not found', 404);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
