import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeInventoryLog, serializeProduct } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const products = db
      .prepare(`
        SELECT p.*, c.name as categoryName, b.name as brandName
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        ORDER BY p.stock ASC, p.name ASC
      `)
      .all()
      .map(serializeProduct);

    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
    const outOfStock = products.filter((p) => p.stock === 0);

    const logs = db
      .prepare('SELECT * FROM inventory_logs ORDER BY createdAt DESC LIMIT 100')
      .all()
      .map(serializeInventoryLog);

    return ok({ products, lowStock, outOfStock, logs });
  } catch (err) {
    return handleApiError(err);
  }
}
