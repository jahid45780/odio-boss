import { getSessionUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api-response';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail('Not authenticated', 401);
  }
  return ok({ user });
}
