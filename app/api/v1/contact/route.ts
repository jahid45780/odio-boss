import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb, genId } from '@/lib/db';
import { created, handleApiError } from '@/lib/api-response';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.parse(body);

    const db = getDb();
    db.prepare('INSERT INTO contact_messages (id, name, email, subject, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(
      genId(),
      parsed.name,
      parsed.email,
      parsed.subject,
      parsed.message,
      new Date().toISOString()
    );

    return created({ submitted: true, message: 'Your inquiry has been received by our acoustic concierge team.' });
  } catch (err) {
    return handleApiError(err);
  }
}
