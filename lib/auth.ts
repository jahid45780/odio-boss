import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './db';

export const AUTH_COOKIE_NAME = 'soniq_token';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'soniq_dev_fallback_secret_change_in_production_2026';
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone: string;
  isBlocked: boolean;
  addresses: UserAddress[];
  createdAt: string;
}

export interface UserAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { sub: string; role: 'CUSTOMER' | 'ADMIN'; email: string }): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { sub: string; role: 'CUSTOMER' | 'ADMIN'; email: string };
  } catch {
    return null;
  }
}

function isHttpsRequest(req?: NextRequest): boolean {
  if (req) {
    const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    if (forwardedProto) return forwardedProto === 'https';
    if (req.nextUrl.protocol === 'https:') return true;
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    if (origin.startsWith('https://')) return true;
    return false;
  }
  return Boolean(process.env.APP_URL?.startsWith('https://'));
}

export function attachAuthCookie(res: NextResponse, token: string, req?: NextRequest) {
  const secure = isHttpsRequest(req);
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res: NextResponse, req?: NextRequest) {
  const secure = isHttpsRequest(req);
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.sub) return null;

    const db = getDb();
    const row = db
      .prepare('SELECT id, name, email, role, phone, isBlocked, addressesJson, createdAt FROM users WHERE id = ?')
      .get(payload.sub) as Record<string, unknown> | undefined;

    if (!row || Number(row.isBlocked) === 1) return null;

    let addresses: UserAddress[] = [];
    try {
      addresses = JSON.parse(String(row.addressesJson || '[]'));
    } catch {
      addresses = [];
    }

    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: row.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
      phone: String(row.phone || ''),
      isBlocked: Boolean(row.isBlocked),
      addresses,
      createdAt: String(row.createdAt),
    };
  } catch {
    return null;
  }
}
