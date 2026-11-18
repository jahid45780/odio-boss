import { NextRequest } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { ok } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  const response = ok({ loggedOut: true });
  clearAuthCookie(response, req);
  return response;
}
