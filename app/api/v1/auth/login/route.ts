import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { attachAuthCookie, signToken, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const db = getDb();
    const row = db
      .prepare('SELECT id, name, email, passwordHash, role, phone, isBlocked, addressesJson, createdAt FROM users WHERE email = ?')
      .get(parsed.email) as Record<string, unknown> | undefined;

    if (!row) {
      return fail('Invalid email or password.', 401);
    }

    if (Number(row.isBlocked) === 1) {
      return fail('This account has been suspended. Please contact concierge support.', 403);
    }

    const valid = await verifyPassword(parsed.password, String(row.passwordHash));
    if (!valid) {
      return fail('Invalid email or password.', 401);
    }

    const role = row.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    const token = await signToken({ sub: String(row.id), role, email: String(row.email) });

    let addresses = [];
    try {
      addresses = JSON.parse(String(row.addressesJson || '[]'));
    } catch {
      addresses = [];
    }

    const response = ok({
      user: {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        role,
        phone: String(row.phone || ''),
        isBlocked: false,
        addresses,
        createdAt: String(row.createdAt),
      },
    });
    attachAuthCookie(response, token, req);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
