import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeOrder } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);

    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM orders WHERE userId = ? OR customerEmail = ? ORDER BY createdAt DESC')
      .all(user.id, user.email);

    return ok({ orders: rows.map(serializeOrder) });
  } catch (err) {
    return handleApiError(err);
  }
}
