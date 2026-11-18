import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser, hashPassword, verifyPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validations';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);

    const body = await req.json();
    const parsed = changePasswordSchema.parse(body);

    const db = getDb();
    const row = db.prepare('SELECT passwordHash FROM users WHERE id = ?').get(user.id) as { passwordHash: string } | undefined;
    if (!row) return fail('User not found', 404);

    const valid = await verifyPassword(parsed.currentPassword, row.passwordHash);
    if (!valid) {
      return fail('Current password is incorrect.', 400);
    }

    const newHash = await hashPassword(parsed.newPassword);
    db.prepare('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(
      newHash,
      new Date().toISOString(),
      user.id
    );

    return ok({ message: 'Password updated successfully.' });
  } catch (err) {
    return handleApiError(err);
  }
}
