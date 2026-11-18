import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { attachAuthCookie, hashPassword, signToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { created, fail, handleApiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.email);
    if (existing) {
      return fail('An account with this email address already exists.', 409);
    }

    const id = genId();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(parsed.password);

    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, role, phone, isBlocked, addressesJson, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'CUSTOMER', ?, 0, '[]', ?, ?)
    `).run(id, parsed.name, parsed.email, passwordHash, parsed.phone || '', now, now);

    const token = await signToken({ sub: id, role: 'CUSTOMER', email: parsed.email });
    const response = created({
      user: {
        id,
        name: parsed.name,
        email: parsed.email,
        role: 'CUSTOMER',
        phone: parsed.phone || '',
        isBlocked: false,
        addresses: [],
        createdAt: now,
      },
    });
    attachAuthCookie(response, token, req);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
