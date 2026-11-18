import { NextRequest } from 'next/server';
import { getDb, genId, slugify } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { productSchema } from '@/lib/validations';
import { serializeProduct, serializeReview } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const row = db
      .prepare(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        WHERE p.id = ? OR p.slug = ?
      `)
      .get(id, id) as Record<string, unknown> | undefined;

    if (!row) {
      return fail('Product not found', 404);
    }

    const product = serializeProduct(row);

    const reviews = db
      .prepare(`
        SELECT * FROM reviews
        WHERE productId = ? AND status = 'APPROVED'
        ORDER BY createdAt DESC
      `)
      .all(product.id)
      .map(serializeReview);

    const related = db
      .prepare(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        WHERE p.isPublished = 1 AND p.id != ? AND (p.categoryId = ? OR p.brandId = ?)
        ORDER BY p.isFeatured DESC, p.soldCount DESC
        LIMIT 4
      `)
      .all(product.id, product.categoryId, product.brandId)
      .map(serializeProduct);

    return ok({ product, reviews, related });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return fail('Product not found', 404);

    const body = await req.json();
    const parsed = productSchema.partial().parse(body);
    const now = new Date().toISOString();

    const nextName = parsed.name ?? String(existing.name);
    const nextSlug = parsed.slug ? slugify(parsed.slug) : String(existing.slug);
    const nextStock = parsed.stock !== undefined ? parsed.stock : Number(existing.stock);
    const prevStock = Number(existing.stock);

    db.prepare(`
      UPDATE products SET
        name = ?,
        slug = ?,
        sku = ?,
        description = ?,
        shortDescription = ?,
        price = ?,
        previousPrice = ?,
        categoryId = ?,
        brandId = ?,
        stock = ?,
        imagesJson = ?,
        specsJson = ?,
        isFeatured = ?,
        isBestSeller = ?,
        isNewArrival = ?,
        isPublished = ?,
        updatedAt = ?
      WHERE id = ?
    `).run(
      nextName,
      nextSlug,
      parsed.sku ?? String(existing.sku),
      parsed.description ?? String(existing.description),
      parsed.shortDescription ?? String(existing.shortDescription ?? ''),
      parsed.price ?? Number(existing.price),
      parsed.previousPrice !== undefined ? parsed.previousPrice : (existing.previousPrice as number | null),
      parsed.categoryId ?? String(existing.categoryId),
      parsed.brandId ?? String(existing.brandId),
      nextStock,
      parsed.images ? JSON.stringify(parsed.images) : String(existing.imagesJson),
      parsed.specs ? JSON.stringify(parsed.specs) : String(existing.specsJson),
      parsed.isFeatured !== undefined ? (parsed.isFeatured ? 1 : 0) : Number(existing.isFeatured),
      parsed.isBestSeller !== undefined ? (parsed.isBestSeller ? 1 : 0) : Number(existing.isBestSeller),
      parsed.isNewArrival !== undefined ? (parsed.isNewArrival ? 1 : 0) : Number(existing.isNewArrival),
      parsed.isPublished !== undefined ? (parsed.isPublished ? 1 : 0) : Number(existing.isPublished),
      now,
      id
    );

    if (nextStock !== prevStock) {
      db.prepare(`
        INSERT INTO inventory_logs (id, productId, productName, sku, previousStock, changeAmount, newStock, reason, actorName, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Admin product update', ?, ?)
      `).run(
        genId(),
        id,
        nextName,
        parsed.sku ?? String(existing.sku),
        prevStock,
        nextStock - prevStock,
        nextStock,
        user.name,
        now
      );
    }

    const updatedRow = db
      .prepare(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        WHERE p.id = ?
      `)
      .get(id) as Record<string, unknown>;

    return ok({ product: serializeProduct(updatedRow) });
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
    const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (Number(res.changes) === 0) return fail('Product not found', 404);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
