import { NextRequest } from 'next/server';
import { getDb, genId, slugify } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { productSchema } from '@/lib/validations';
import { serializeProduct } from '@/lib/serializers';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = req.nextUrl;

    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const brand = searchParams.get('brand')?.trim() || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const inStock = searchParams.get('inStock');
    const featured = searchParams.get('featured');
    const bestSeller = searchParams.get('bestSeller');
    const newArrival = searchParams.get('newArrival');
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 12)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (includeUnpublished) {
      const user = await getSessionUser();
      if (!user || user.role !== 'ADMIN') {
        conditions.push('p.isPublished = 1');
      }
    } else {
      conditions.push('p.isPublished = 1');
    }

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.shortDescription LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (category) {
      conditions.push('(c.slug = ? OR p.categoryId = ?)');
      params.push(category, category);
    }

    if (brand) {
      conditions.push('(b.slug = ? OR p.brandId = ?)');
      params.push(brand, brand);
    }

    if (minPrice !== null && minPrice !== '' && !Number.isNaN(Number(minPrice))) {
      conditions.push('p.price >= ?');
      params.push(Number(minPrice));
    }

    if (maxPrice !== null && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
      conditions.push('p.price <= ?');
      params.push(Number(maxPrice));
    }

    if (minRating !== null && minRating !== '' && !Number.isNaN(Number(minRating))) {
      conditions.push('p.ratingAverage >= ?');
      params.push(Number(minRating));
    }

    if (inStock === 'true') {
      conditions.push('p.stock > 0');
    }

    if (featured === 'true') conditions.push('p.isFeatured = 1');
    if (bestSeller === 'true') conditions.push('p.isBestSeller = 1');
    if (newArrival === 'true') conditions.push('p.isNewArrival = 1');

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.createdAt DESC';
    switch (sort) {
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'popular':
        orderBy = 'p.soldCount DESC, p.ratingAverage DESC';
        break;
      case 'rating':
        orderBy = 'p.ratingAverage DESC, p.ratingCount DESC';
        break;
      default:
        orderBy = 'p.createdAt DESC';
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      LEFT JOIN brands b ON p.brandId = b.id
      ${whereClause}
    `;
    const totalRow = db.prepare(countQuery).get(...params) as { total: number };
    const total = Number(totalRow.total || 0);

    const dataQuery = `
      SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      LEFT JOIN brands b ON p.brandId = b.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(dataQuery).all(...params, limit, offset);

    return ok({
      products: rows.map(serializeProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
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
    const parsed = productSchema.parse(body);

    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();
    const baseSlug = slugify(parsed.slug || parsed.name);
    const slugExists = db.prepare('SELECT id FROM products WHERE slug = ?').get(baseSlug);
    const finalSlug = slugExists ? `${baseSlug}-${id.slice(0, 5)}` : baseSlug;

    db.prepare(`
      INSERT INTO products (
        id, name, slug, sku, description, shortDescription, price, previousPrice,
        categoryId, brandId, stock, soldCount, ratingAverage, ratingCount,
        imagesJson, specsJson, isFeatured, isBestSeller, isNewArrival, isPublished, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.name,
      finalSlug,
      parsed.sku,
      parsed.description,
      parsed.shortDescription || '',
      parsed.price,
      parsed.previousPrice ?? null,
      parsed.categoryId,
      parsed.brandId,
      parsed.stock,
      JSON.stringify(parsed.images),
      JSON.stringify(parsed.specs),
      parsed.isFeatured ? 1 : 0,
      parsed.isBestSeller ? 1 : 0,
      parsed.isNewArrival ? 1 : 0,
      parsed.isPublished ? 1 : 0,
      now,
      now
    );

    db.prepare(`
      INSERT INTO inventory_logs (id, productId, productName, sku, previousStock, changeAmount, newStock, reason, actorName, createdAt)
      VALUES (?, ?, ?, ?, 0, ?, ?, 'Initial stock on product creation', ?, ?)
    `).run(genId(), id, parsed.name, parsed.sku, parsed.stock, parsed.stock, user.name, now);

    const createdRow = db
      .prepare(`
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        WHERE p.id = ?
      `)
      .get(id) as Record<string, unknown>;

    return created({ product: serializeProduct(createdRow) });
  } catch (err) {
    return handleApiError(err);
  }
}
