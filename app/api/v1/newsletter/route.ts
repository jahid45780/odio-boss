import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb, genId } from '@/lib/db';
import { created, handleApiError, ok } from '@/lib/api-response';

const subSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = subSchema.parse(body);

    const db = getDb();
    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email);
    if (existing) {
      return ok({ subscribed: true, message: 'You are already subscribed to SONIQ Acoustic Dispatches.' });
    }

    db.prepare('INSERT INTO newsletter_subscribers (id, email, createdAt) VALUES (?, ?, ?)').run(
      genId(),
      email,
      new Date().toISOString()
    );

    return created({ subscribed: true, message: 'Welcome to SONIQ Acoustic Dispatches.' });
  } catch (err) {
    return handleApiError(err);
  }
}
