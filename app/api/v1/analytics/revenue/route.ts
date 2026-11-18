import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const monthly = db
      .prepare(`
        SELECT substr(createdAt, 1, 7) as month,
               COALESCE(SUM(totalAmount), 0) as revenue,
               COALESCE(AVG(totalAmount), 0) as avgOrderValue,
               COUNT(*) as orders
        FROM orders
        WHERE orderStatus != 'Cancelled'
        GROUP BY substr(createdAt, 1, 7)
        ORDER BY month ASC
      `)
      .all();

    return ok({ revenue: monthly });
  } catch (err) {
    return handleApiError(err);
  }
}
