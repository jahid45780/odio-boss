import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { uploadImageFile } from '@/lib/upload';
import { genId, getDb } from '@/lib/db';
import { fail, handleApiError, ok } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('Authentication required', 401);
    if (user.role !== 'ADMIN') return fail('Administrator access required', 403);

    const formData = await req.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    const singleFile = formData.get('file');
    if (singleFile instanceof File) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return fail('No image files provided', 400);
    }

    const folder = String(formData.get('folder') || 'soniq');
    const category = folder.includes('hero') || folder.includes('banner')
      ? 'banner'
      : folder.includes('logo')
      ? 'logo'
      : folder.includes('background')
      ? 'background'
      : 'product';

    const db = getDb();
    const now = new Date().toISOString();
    const uploaded = [];
    for (const file of files) {
      const result = await uploadImageFile(file, folder);
      db.prepare(
        'INSERT INTO media_assets (id, url, publicId, label, category, provider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(genId(), result.url, result.publicId, file.name || 'Uploaded Image', category, result.provider, now);
      uploaded.push(result);
    }

    return ok({ files: uploaded });
  } catch (err) {
    return handleApiError(err);
  }
}
