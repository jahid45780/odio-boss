import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { fail, handleApiError, ok } from '@/lib/api-response';

const validateSchema = z.object({
  code: z.string().trim().min(1).transform((v) => v.toUpperCase()),
  subtotal: z.coerce.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, subtotal } = validateSchema.parse(body);

    const db = getDb();
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND isActive = 1').get(code) as Record<string, unknown> | undefined;
    if (!coupon) {
      return fail('Coupon code is invalid or inactive.', 404);
    }

    if (new Date(String(coupon.expiresAt)).getTime() < Date.now()) {
      return fail('This coupon code has expired.', 400);
    }

    if (coupon.usageLimit !== null && Number(coupon.usedCount) >= Number(coupon.usageLimit)) {
      return fail('This coupon has reached its usage limit.', 400);
    }

    const minOrder = Number(coupon.minOrderAmount || 0);
    if (subtotal < minOrder) {
      return fail(`Minimum subtotal of $${minOrder.toFixed(2)} required for this coupon.`, 400);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount !== null && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }
    discountAmount = Math.min(subtotal, Number(discountAmount.toFixed(2)));

    return ok({
      code,
      discountType: String(coupon.discountType),
      discountValue: Number(coupon.discountValue),
      discountAmount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
