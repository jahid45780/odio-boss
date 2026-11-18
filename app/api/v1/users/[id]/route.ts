import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { serializeOrder } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const customer = db
      .prepare('SELECT id, name, email, phone, isBlocked, addressesJson, createdAt FROM users WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;

    if (!customer) return fail('Customer not found', 404);

    const orders = db
      .prepare('SELECT * FROM orders WHERE userId = ? OR customerEmail = ? ORDER BY createdAt DESC')
      .all(id, String(customer.email))
      .map(serializeOrder);

    return ok({
      customer: {
        id: String(customer.id),
        name: String(customer.name),
        email: String(customer.email),
        phone: String(customer.phone || ''),
        isBlocked: Boolean(customer.isBlocked),
        addresses: JSON.parse(String(customer.addressesJson || '[]')),
        createdAt: String(customer.createdAt),
      },
      orders,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const blockSchema = z.object({
  isBlocked: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as { id: string; role: string } | undefined;
    if (!existing) return fail('User not found', 404);
    if (existing.role === 'ADMIN') return fail('Cannot block an administrator account', 400);

    const body = await req.json();
    const { isBlocked } = blockSchema.parse(body);

    db.prepare('UPDATE users SET isBlocked = ?, updatedAt = ? WHERE id = ?').run(
      isBlocked ? 1 : 0,
      new Date().toISOString(),
      id
    );

    return ok({ id, isBlocked });
  } catch (err) {
    return handleApiError(err);
  }
}
