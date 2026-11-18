import { NextRequest } from 'next/server';
import { getDb, genId } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { uploadImageFile, deleteUploadedImage } from '@/lib/upload';
import { serializeMediaAsset } from '@/lib/serializers';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const db = getDb();
    const category = req.nextUrl.searchParams.get('category');
    const rows =
      category && category !== 'all'
        ? db.prepare('SELECT * FROM media_assets WHERE category = ? ORDER BY createdAt DESC').all(category)
        : db.prepare('SELECT * FROM media_assets ORDER BY createdAt DESC').all();
    return ok({ assets: rows.map(serializeMediaAsset) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return fail('Image file is required', 400);
    }

    const category = String(formData.get('category') || 'general');
    const label = String(formData.get('label') || file.name || 'Uploaded Image').slice(0, 120);
    const folder = `soniq/${category}`;

    const result = await uploadImageFile(file, folder);
    const db = getDb();
    const now = new Date().toISOString();
    const id = genId();

    db.prepare(
      'INSERT INTO media_assets (id, url, publicId, label, category, provider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, result.url, result.publicId, label, category, result.provider, now);

    const created = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ asset: serializeMediaAsset(created) }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const formData = await req.formData();
    const id = String(formData.get('id') || '');
    const file = formData.get('file');
    if (!id || !(file instanceof File)) {
      return fail('Asset id and replacement file are required', 400);
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return fail('Media asset not found', 404);

    const oldUrl = String(existing.url);
    const oldPublicId = String(existing.publicId || '');
    const category = String(formData.get('category') || existing.category || 'general');
    const result = await uploadImageFile(file, `soniq/${category}`);

    db.prepare('UPDATE media_assets SET url = ?, publicId = ?, provider = ? WHERE id = ?').run(
      result.url,
      result.publicId,
      result.provider,
      id
    );

    // Propagate replacement URL if asset was assigned to hero, logo, or banners
    db.prepare('UPDATE website_settings SET heroImageUrl = ? WHERE heroImageUrl = ?').run(result.url, oldUrl);
    db.prepare('UPDATE website_settings SET logoUrl = ? WHERE logoUrl = ?').run(result.url, oldUrl);
    db.prepare('UPDATE banners SET imageUrl = ? WHERE imageUrl = ?').run(result.url, oldUrl);

    if (oldPublicId) {
      await deleteUploadedImage(oldPublicId);
    }

    const updated = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as Record<string, unknown>;
    return ok({ asset: serializeMediaAsset(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
