import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeProduct } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

const adjustSchema = z.object({
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  reason: z.string().trim().min(2).max(200).default('Manual inventory adjustment'),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { productId } = await params;
    const db = getDb();
    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Record<string, unknown> | undefined;
    if (!prod) return fail('Product not found', 404);

    const body = await req.json();
    const { stock, reason } = adjustSchema.parse(body);

    const prevStock = Number(prod.stock);
    const diff = stock - prevStock;
    const now = new Date().toISOString();

    db.prepare('UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?').run(stock, now, productId);
    db.prepare(`
      INSERT INTO inventory_logs (id, productId, productName, sku, previousStock, changeAmount, newStock, reason, actorName, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(genId(), productId, String(prod.name), String(prod.sku), prevStock, diff, stock, reason, user.name, now);

    const updated = db
      .prepare('SELECT p.*, c.name as categoryName, b.name as brandName FROM products p LEFT JOIN categories c ON p.categoryId = c.id LEFT JOIN brands b ON p.brandId = b.id WHERE p.id = ?')
      .get(productId) as Record<string, unknown>;

    return ok({ product: serializeProduct(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
