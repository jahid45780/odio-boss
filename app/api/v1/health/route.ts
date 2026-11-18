import { getDb } from '@/lib/db';
import { ok } from '@/lib/api-response';

export async function GET() {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as products FROM products').get() as { products: number };
  return ok({ status: 'healthy', service: 'soniq-api', products: row.products, timestamp: new Date().toISOString() });
}
