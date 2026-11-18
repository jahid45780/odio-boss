import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validations';
import { serializeOrder, serializeSettings } from '@/lib/serializers';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const status = req.nextUrl.searchParams.get('status')?.trim() || '';
    const search = req.nextUrl.searchParams.get('search')?.trim() || '';

    const conditions: string[] = [];
    const params: string[] = [];

    if (status && status !== 'ALL') {
      conditions.push('orderStatus = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(orderNumber LIKE ? OR customerName LIKE ? OR customerEmail LIKE ?)');
      const pat = `%${search}%`;
      params.push(pat, pat, pat);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY createdAt DESC`).all(...params);
    return ok({ orders: rows.map(serializeOrder) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const parsed = createOrderSchema.parse(body);

    const db = getDb();
    const now = new Date().toISOString();

    const settingsRow = db.prepare('SELECT * FROM website_settings WHERE id = ?').get('default') as Record<string, unknown>;
    const settings = serializeSettings(settingsRow);

    if (parsed.paymentMethod === 'ONLINE' && !process.env.STRIPE_SECRET_KEY) {
      return fail('Online payment gateway is not configured in this environment. Please choose Cash on Delivery.', 400);
    }

    // Begin atomic transaction for stock validation, deduction, and order creation
    db.exec('BEGIN IMMEDIATE;');
    try {
      let subtotal = 0;
      const resolvedItems: Array<{
        productId: string;
        name: string;
        sku: string;
        price: number;
        quantity: number;
        imageUrl: string;
        previousStock: number;
      }> = [];

      for (const item of parsed.items) {
        const prod = db
          .prepare('SELECT id, name, sku, price, stock, imagesJson, isPublished FROM products WHERE id = ?')
          .get(item.productId) as Record<string, unknown> | undefined;

        if (!prod || Number(prod.isPublished) === 0) {
          throw new Error('One or more products in your cart are no longer available.');
        }

        const currentStock = Number(prod.stock);
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${String(prod.name)}. Available: ${currentStock}`);
        }

        const unitPrice = Number(prod.price);
        subtotal += unitPrice * item.quantity;

        let images: string[] = [];
        try {
          images = JSON.parse(String(prod.imagesJson || '[]'));
        } catch {
          images = [];
        }

        resolvedItems.push({
          productId: String(prod.id),
          name: String(prod.name),
          sku: String(prod.sku),
          price: unitPrice,
          quantity: item.quantity,
          imageUrl: images[0] || '/images/hero-flagship.jpg',
          previousStock: currentStock,
        });
      }

      // Server-side coupon calculation
      let discountAmount = 0;
      let appliedCoupon = '';
      if (parsed.couponCode) {
        const code = parsed.couponCode.toUpperCase();
        const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND isActive = 1').get(code) as Record<string, unknown> | undefined;
        if (!coupon) {
          throw new Error('Coupon code is invalid or inactive.');
        }
        if (new Date(String(coupon.expiresAt)).getTime() < Date.now()) {
          throw new Error('Coupon code has expired.');
        }
        if (coupon.usageLimit !== null && Number(coupon.usedCount) >= Number(coupon.usageLimit)) {
          throw new Error('Coupon usage limit has been reached.');
        }
        if (subtotal < Number(coupon.minOrderAmount || 0)) {
          throw new Error(`Minimum order amount of ${settings.currencySymbol}${Number(coupon.minOrderAmount)} required for this coupon.`);
        }

        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscountAmount !== null && discountAmount > Number(coupon.maxDiscountAmount)) {
            discountAmount = Number(coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = Number(coupon.discountValue);
        }
        discountAmount = Math.min(subtotal, Number(discountAmount.toFixed(2)));
        appliedCoupon = code;

        db.prepare('UPDATE coupons SET usedCount = usedCount + 1, updatedAt = ? WHERE id = ?').run(now, String(coupon.id));
      }

      const afterDiscount = Math.max(0, subtotal - discountAmount);
      const shippingFee = afterDiscount >= settings.freeShippingThreshold ? 0 : settings.shippingCharge;
      const totalAmount = Number((afterDiscount + shippingFee).toFixed(2));

      // Deduct stock and record inventory logs
      for (const item of resolvedItems) {
        const newStock = item.previousStock - item.quantity;
        db.prepare('UPDATE products SET stock = ?, soldCount = soldCount + ?, updatedAt = ? WHERE id = ?').run(
          newStock,
          item.quantity,
          now,
          item.productId
        );
        db.prepare(`
          INSERT INTO inventory_logs (id, productId, productName, sku, previousStock, changeAmount, newStock, reason, actorName, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          genId(),
          item.productId,
          item.name,
          item.sku,
          item.previousStock,
          -item.quantity,
          newStock,
          'Customer order placement',
          parsed.customerName,
          now
        );
      }

      const orderId = genId();
      const orderNumber = `SNQ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      db.prepare(`
        INSERT INTO orders (
          id, orderNumber, userId, customerName, customerEmail, customerPhone,
          shippingCountry, shippingCity, shippingAddress, postalCode, itemsJson,
          subtotal, discountAmount, couponCode, shippingFee, totalAmount,
          paymentMethod, paymentStatus, orderStatus, trackingNumber, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?, ?, ?)
      `).run(
        orderId,
        orderNumber,
        user?.id ?? null,
        parsed.customerName,
        parsed.customerEmail,
        parsed.customerPhone,
        parsed.shippingCountry,
        parsed.shippingCity,
        parsed.shippingAddress,
        parsed.postalCode,
        JSON.stringify(resolvedItems.map(({ previousStock: _prev, ...rest }) => rest)),
        Number(subtotal.toFixed(2)),
        discountAmount,
        appliedCoupon,
        shippingFee,
        totalAmount,
        parsed.paymentMethod,
        parsed.paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
        parsed.notes || '',
        now,
        now
      );

      db.exec('COMMIT;');

      const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>;
      return created({ order: serializeOrder(orderRow) });
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    return handleApiError(err);
  }
}
