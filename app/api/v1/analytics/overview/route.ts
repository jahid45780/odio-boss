import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeOrder, serializeProduct } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();

    const revRow = db
      .prepare("SELECT COALESCE(SUM(totalAmount), 0) as totalRevenue, COUNT(*) as totalOrders FROM orders WHERE orderStatus != 'Cancelled'")
      .get() as { totalRevenue: number; totalOrders: number };

    const pendingRow = db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE orderStatus IN ('Pending', 'Confirmed', 'Processing')")
      .get() as { count: number };

    const completedRow = db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE orderStatus = 'Delivered'")
      .get() as { count: number };

    const productsRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const customersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'").get() as { count: number };

    const lowStockProducts = db
      .prepare(`
        SELECT p.*, c.name as categoryName, b.name as brandName
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        WHERE p.stock <= 10
        ORDER BY p.stock ASC
        LIMIT 8
      `)
      .all()
      .map(serializeProduct);

    const recentOrders = db
      .prepare('SELECT * FROM orders ORDER BY createdAt DESC LIMIT 6')
      .all()
      .map(serializeOrder);

    const bestSellingProducts = db
      .prepare(`
        SELECT p.*, c.name as categoryName, b.name as brandName
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN brands b ON p.brandId = b.id
        ORDER BY p.soldCount DESC
        LIMIT 5
      `)
      .all()
      .map(serializeProduct);

    const monthlySeries = db
      .prepare(`
        SELECT substr(createdAt, 1, 7) as month,
               COALESCE(SUM(totalAmount), 0) as revenue,
               COUNT(*) as orders
        FROM orders
        WHERE orderStatus != 'Cancelled'
        GROUP BY substr(createdAt, 1, 7)
        ORDER BY month ASC
        LIMIT 12
      `)
      .all() as Array<{ month: string; revenue: number; orders: number }>;

    return ok({
      kpis: {
        totalRevenue: Number(revRow.totalRevenue || 0),
        totalOrders: Number(revRow.totalOrders || 0),
        totalProducts: Number(productsRow.count || 0),
        totalCustomers: Number(customersRow.count || 0),
        pendingOrders: Number(pendingRow.count || 0),
        completedOrders: Number(completedRow.count || 0),
        lowStockCount: lowStockProducts.length,
      },
      monthlySeries: monthlySeries.map((m) => ({
        month: m.month,
        revenue: Number(m.revenue),
        orders: Number(m.orders),
      })),
      recentOrders,
      lowStockProducts,
      bestSellingProducts,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
