import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(err.issues[0]?.message || 'Validation error', 400, err.issues);
  }
  if (err instanceof Error) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return fail('A record with that unique value already exists.', 409);
    }
    return fail(err.message, 400);
  }
  return fail('Internal server error', 500);
}
