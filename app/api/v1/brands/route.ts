import { NextRequest } from 'next/server';
import { getDb, genId, slugify } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { brandSchema } from '@/lib/validations';
import { serializeBrand } from '@/lib/serializers';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brandId = b.id AND p.isPublished = 1) as productCount
        FROM brands b
        ORDER BY b.name ASC
      `)
      .all();

    return ok({ brands: rows.map(serializeBrand) });
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
    const parsed = brandSchema.parse(body);
    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();
    const slug = slugify(parsed.slug || parsed.name);

    db.prepare(`
      INSERT INTO brands (id, name, slug, description, logoUrl, logoPublicId, isFeatured, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.name,
      slug,
      parsed.description || '',
      parsed.logoUrl || '',
      parsed.logoPublicId || '',
      parsed.isFeatured ? 1 : 0,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM brands WHERE id = ?').get(id) as Record<string, unknown>;
    return created({ brand: serializeBrand(row) });
  } catch (err) {
    return handleApiError(err);
  }
}
