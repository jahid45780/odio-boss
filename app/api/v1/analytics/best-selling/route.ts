import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeProduct } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const rows = db
      .prepare(`
        SELECT p.*, c.name as categoryName, b.name as brandName
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        ORDER BY p.soldCount DESC
        LIMIT 10
      `)
      .all();

    return ok({ products: rows.map(serializeProduct) });
  } catch (err) {
    return handleApiError(err);
  }
}
