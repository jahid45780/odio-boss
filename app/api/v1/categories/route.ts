import { NextRequest } from 'next/server';
import { getDb, genId, slugify } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';
import { serializeCategory } from '@/lib/serializers';
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
      .prepare(`
        SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id AND p.isPublished = 1) as productCount
        FROM categories c
        ${showAll ? '' : 'WHERE c.isActive = 1'}
        ORDER BY c.sortOrder ASC, c.name ASC
      `)
      .all();

    return ok({ categories: rows.map(serializeCategory) });
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
    const parsed = categorySchema.parse(body);
    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();
    const slug = slugify(parsed.slug || parsed.name);

    db.prepare(`
      INSERT INTO categories (id, name, slug, description, imageUrl, imagePublicId, isActive, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.name,
      slug,
      parsed.description || '',
      parsed.imageUrl || '',
      parsed.imagePublicId || '',
      parsed.isActive ? 1 : 0,
      parsed.sortOrder ?? 0,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown>;
    return created({ category: serializeCategory(row) });
  } catch (err) {
    return handleApiError(err);
  }
}
