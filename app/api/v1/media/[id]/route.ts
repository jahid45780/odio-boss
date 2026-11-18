import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { deleteUploadedImage } from '@/lib/upload';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return fail('Media asset not found', 404);

    const publicId = String(existing.publicId || '');
    if (publicId) {
      await deleteUploadedImage(publicId);
    }

    db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
