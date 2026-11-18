import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeReview } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

const statusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

function recomputeProductRating(productId: string) {
  const db = getDb();
  const stats = db
    .prepare("SELECT COUNT(*) as cnt, COALESCE(AVG(rating), 0) as avgRating FROM reviews WHERE productId = ? AND status = 'APPROVED'")
    .get(productId) as { cnt: number; avgRating: number };
  db.prepare('UPDATE products SET ratingAverage = ?, ratingCount = ? WHERE id = ?').run(
    Number(Number(stats.avgRating || 0).toFixed(1)),
    Number(stats.cnt || 0),
    productId
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return fail('Review not found', 404);

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    db.prepare('UPDATE reviews SET status = ?, updatedAt = ? WHERE id = ?').run(status, new Date().toISOString(), id);
    recomputeProductRating(String(existing.productId));

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ review: serializeReview(updated) });
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
    const existing = db.prepare('SELECT productId FROM reviews WHERE id = ?').get(id) as { productId: string } | undefined;
    if (!existing) return fail('Review not found', 404);

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    recomputeProductRating(existing.productId);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
