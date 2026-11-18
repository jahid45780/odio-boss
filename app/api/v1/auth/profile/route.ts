import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser, type UserAddress } from '@/lib/auth';
import { addressSchema, profileUpdateSchema } from '@/lib/validations';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);

    const body = await req.json();
    const db = getDb();
    const now = new Date().toISOString();

    if (body.action === 'add_address') {
      const addr = addressSchema.parse(body.address);
      const newAddr: UserAddress = {
        ...addr,
        id: genId(),
      };
      const existing = user.addresses;
      const updated = newAddr.isDefault
        ? [...existing.map((a) => ({ ...a, isDefault: false })), newAddr]
        : [...existing, newAddr];
      db.prepare('UPDATE users SET addressesJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(updated),
        now,
        user.id
      );
      return ok({ addresses: updated });
    }

    if (body.action === 'delete_address' && typeof body.addressId === 'string') {
      const updated = user.addresses.filter((a) => a.id !== body.addressId);
      db.prepare('UPDATE users SET addressesJson = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(updated),
        now,
        user.id
      );
      return ok({ addresses: updated });
    }

    const parsed = profileUpdateSchema.parse(body);
    db.prepare('UPDATE users SET name = ?, phone = ?, updatedAt = ? WHERE id = ?').run(
      parsed.name,
      parsed.phone || '',
      now,
      user.id
    );

    return ok({
      user: {
        ...user,
        name: parsed.name,
        phone: parsed.phone || '',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
