import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { fail, handleApiError, ok } from '@/lib/api-response';

const resetSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = resetSchema.parse(body);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDb();
    const user = db
      .prepare('SELECT id, resetTokenExpiry FROM users WHERE resetTokenHash = ?')
      .get(tokenHash) as { id: string; resetTokenExpiry: number } | undefined;

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      return fail('Reset token is invalid or has expired.', 400);
    }

    const passwordHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET passwordHash = ?, resetTokenHash = NULL, resetTokenExpiry = NULL, updatedAt = ? WHERE id = ?').run(
      passwordHash,
      new Date().toISOString(),
      user.id
    );

    return ok({ message: 'Password has been reset successfully. You may now sign in.' });
  } catch (err) {
    return handleApiError(err);
  }
}
