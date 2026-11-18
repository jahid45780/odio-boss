import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { attachAuthCookie, hashPassword, signToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { created, fail, handleApiError, ok } from '@/lib/api-response';

export async function GET() {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number };
  return ok({ adminExists: row.count > 0 });
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number };
    if (row.count > 0) {
      return fail('Administrator account is already initialized. Please sign in.', 403);
    }

    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.email);
    if (existingEmail) {
      return fail('Email is already registered.', 409);
    }

    const id = genId();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(parsed.password);

    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, role, phone, isBlocked, addressesJson, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, 0, '[]', ?, ?)
    `).run(id, parsed.name, parsed.email, passwordHash, parsed.phone || '', now, now);

    const token = await signToken({ sub: id, role: 'ADMIN', email: parsed.email });
    const response = created({
      user: {
        id,
        name: parsed.name,
        email: parsed.email,
        role: 'ADMIN',
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
