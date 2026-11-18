import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { couponSchema } from '@/lib/validations';
import { serializeCoupon } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return fail('Coupon not found', 404);

    const body = await req.json();
    const parsed = couponSchema.partial().parse(body);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE coupons SET
        code = ?, discountType = ?, discountValue = ?, minOrderAmount = ?, maxDiscountAmount = ?,
        usageLimit = ?, expiresAt = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      parsed.code ?? String(existing.code),
      parsed.discountType ?? String(existing.discountType),
      parsed.discountValue ?? Number(existing.discountValue),
      parsed.minOrderAmount ?? Number(existing.minOrderAmount),
      parsed.maxDiscountAmount !== undefined ? parsed.maxDiscountAmount : (existing.maxDiscountAmount as number | null),
      parsed.usageLimit !== undefined ? parsed.usageLimit : (existing.usageLimit as number | null),
      parsed.expiresAt ?? String(existing.expiresAt),
      parsed.isActive !== undefined ? (parsed.isActive ? 1 : 0) : Number(existing.isActive),
      now,
      id
    );

    const row = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ coupon: serializeCoupon(row) });
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
    const res = db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    if (Number(res.changes) === 0) return fail('Coupon not found', 404);

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
