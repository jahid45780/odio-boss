import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { orderStatusUpdateSchema } from '@/lib/validations';
import { serializeOrder } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existingRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existingRow) return fail('Order not found', 404);

    const body = await req.json();
    const parsed = orderStatusUpdateSchema.parse(body);
    const now = new Date().toISOString();

    const prevStatus = String(existingRow.orderStatus);
    const nextStatus = parsed.orderStatus ?? prevStatus;
    const nextPayment = parsed.paymentStatus ?? String(existingRow.paymentStatus);
    const nextTracking = parsed.trackingNumber ?? String(existingRow.trackingNumber ?? '');

    db.exec('BEGIN IMMEDIATE;');
    try {
      // Restore stock if transitioning into Cancelled from a non-cancelled/non-returned state
      if (nextStatus === 'Cancelled' && prevStatus !== 'Cancelled' && prevStatus !== 'Returned') {
        const order = serializeOrder(existingRow);
        for (const item of order.items) {
          const prod = db.prepare('SELECT stock, name, sku FROM products WHERE id = ?').get(item.productId) as
            | { stock: number; name: string; sku: string }
            | undefined;
          if (prod) {
            const newStock = Number(prod.stock) + item.quantity;
            db.prepare('UPDATE products SET stock = ?, soldCount = MAX(0, soldCount - ?), updatedAt = ? WHERE id = ?').run(
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
              prod.name,
              prod.sku,
              Number(prod.stock),
              item.quantity,
              newStock,
              `Order ${order.orderNumber} cancelled`,
              user.name,
              now
            );
          }
        }
      }

      db.prepare(`
        UPDATE orders SET orderStatus = ?, paymentStatus = ?, trackingNumber = ?, updatedAt = ? WHERE id = ?
      `).run(nextStatus, nextPayment, nextTracking, now, id);

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ order: serializeOrder(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
