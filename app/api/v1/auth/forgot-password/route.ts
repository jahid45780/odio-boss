import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { handleApiError, ok } from '@/lib/api-response';

const forgotSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotSchema.parse(body);

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;

    let devResetToken: string | undefined;
    if (user) {
      const rawToken = crypto.randomBytes(24).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiry = Date.now() + 30 * 60 * 1000;
      db.prepare('UPDATE users SET resetTokenHash = ?, resetTokenExpiry = ? WHERE id = ?').run(
        tokenHash,
        expiry,
        user.id
      );
      if (process.env.NODE_ENV !== 'production') {
        devResetToken = rawToken;
      }
    }

    return ok({
      message: 'If an account matches that email, password reset instructions have been issued.',
      ...(devResetToken ? { resetToken: devResetToken } : {}),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
