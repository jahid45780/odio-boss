import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { couponSchema } from '@/lib/validations';
import { serializeCoupon } from '@/lib/serializers';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const rows = db.prepare('SELECT * FROM coupons ORDER BY createdAt DESC').all();
    return ok({ coupons: rows.map(serializeCoupon) });
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
    const parsed = couponSchema.parse(body);
    const db = getDb();
    const id = genId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO coupons (id, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, usedCount, expiresAt, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).run(
      id,
      parsed.code,
      parsed.discountType,
      parsed.discountValue,
      parsed.minOrderAmount ?? 0,
      parsed.maxDiscountAmount ?? null,
      parsed.usageLimit ?? null,
      parsed.expiresAt,
      parsed.isActive ? 1 : 0,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as Record<string, unknown>;
    return created({ coupon: serializeCoupon(row) });
  } catch (err) {
    return handleApiError(err);
  }
}
