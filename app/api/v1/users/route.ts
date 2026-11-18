import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const search = req.nextUrl.searchParams.get('search')?.trim() || '';
    const where = search ? "WHERE role = 'CUSTOMER' AND (name LIKE ? OR email LIKE ?)" : "WHERE role = 'CUSTOMER'";
    const params = search ? [`%${search}%`, `%${search}%`] : [];

    const rows = db
      .prepare(`
        SELECT id, name, email, phone, isBlocked, createdAt,
          (SELECT COUNT(*) FROM orders o WHERE o.userId = users.id OR o.customerEmail = users.email) as orderCount,
          (SELECT COALESCE(SUM(o.totalAmount), 0) FROM orders o WHERE (o.userId = users.id OR o.customerEmail = users.email) AND o.orderStatus != 'Cancelled') as totalSpent
        FROM users
        ${where}
        ORDER BY createdAt DESC
      `)
      .all(...params);

    const customers = rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
      phone: String(r.phone || ''),
      isBlocked: Boolean(r.isBlocked),
      orderCount: Number(r.orderCount || 0),
      totalSpent: Number(r.totalSpent || 0),
      createdAt: String(r.createdAt),
    }));

    return ok({ customers });
  } catch (err) {
    return handleApiError(err);
  }
}
