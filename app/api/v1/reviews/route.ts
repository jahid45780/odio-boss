import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { reviewSchema } from '@/lib/validations';
import { serializeReview } from '@/lib/serializers';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const productId = req.nextUrl.searchParams.get('productId');
    const all = req.nextUrl.searchParams.get('all') === 'true';

    if (all) {
      const user = await getSessionUser();
      if (!user || user.role !== 'ADMIN') return fail('Administrator access required', 403);

      const rows = db
        .prepare(`
          SELECT r.*, p.name as productName
          FROM reviews r
          LEFT JOIN products p ON r.productId = p.id
          ORDER BY r.createdAt DESC
        `)
        .all();
      return ok({ reviews: rows.map(serializeReview) });
    }

    const rows = productId
      ? db
          .prepare(`
            SELECT r.*, p.name as productName
            FROM reviews r
            LEFT JOIN products p ON r.productId = p.id
            WHERE r.productId = ? AND r.status = 'APPROVED'
            ORDER BY r.createdAt DESC
          `)
          .all(productId)
      : db
          .prepare(`
            SELECT r.*, p.name as productName
            FROM reviews r
            LEFT JOIN products p ON r.productId = p.id
            WHERE r.status = 'APPROVED'
            ORDER BY r.createdAt DESC
            LIMIT 20
          `)
          .all();

    return ok({ reviews: rows.map(serializeReview) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const parsed = reviewSchema.parse(body);

    const db = getDb();
    const prod = db.prepare('SELECT id FROM products WHERE id = ?').get(parsed.productId);
    if (!prod) return fail('Product not found', 404);

    const id = genId();
    const now = new Date().toISOString();

    let isVerifiedPurchase = 0;
    if (user) {
      const orders = db
        .prepare("SELECT itemsJson FROM orders WHERE (userId = ? OR customerEmail = ?) AND orderStatus != 'Cancelled'")
        .all(user.id, user.email) as Array<{ itemsJson: string }>;
      for (const ord of orders) {
        if (ord.itemsJson.includes(parsed.productId)) {
          isVerifiedPurchase = 1;
          break;
        }
      }
    }

    db.prepare(`
      INSERT INTO reviews (id, productId, userId, authorName, rating, title, comment, status, isVerifiedPurchase, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(
      id,
      parsed.productId,
      user?.id ?? null,
      user?.name || parsed.authorName,
      parsed.rating,
      parsed.title,
      parsed.comment,
      isVerifiedPurchase,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Record<string, unknown>;
    return created({
      review: serializeReview(row),
      message: 'Review submitted and awaiting moderation.',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
