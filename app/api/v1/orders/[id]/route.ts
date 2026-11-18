import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeOrder } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM orders WHERE id = ? OR orderNumber = ?')
      .get(id, id) as Record<string, unknown> | undefined;

    if (!row) return fail('Order not found', 404);

    // If looked up by internal ID, require owner or admin; orderNumber lookup works for confirmation receipts
    const user = await getSessionUser();
    const isAdmin = user?.role === 'ADMIN';
    const isOwner = user && (String(row.userId) === user.id || String(row.customerEmail) === user.email);
    const lookedUpByOrderNumber = String(row.orderNumber) === id;

    if (!isAdmin && !isOwner && !lookedUpByOrderNumber) {
      return fail('Access denied', 403);
    }

    return ok({ order: serializeOrder(row) });
  } catch (err) {
    return handleApiError(err);
  }
}
