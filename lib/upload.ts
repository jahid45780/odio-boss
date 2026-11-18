import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function hasCloudinaryConfig(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadImageFile(file: File, folder = 'soniq'): Promise<{ url: string; publicId: string; provider: 'cloudinary' | 'local' }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('Unsupported file format. Please upload JPEG, PNG, WebP, or SVG images.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image exceeds the 5MB file size limit.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (hasCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (err, res) => {
          if (err || !res) return reject(err || new Error('Cloudinary upload failed'));
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        }
      );
      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  }

  // Local upload persistence fallback when Cloudinary env vars are not yet configured
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const fullPath = path.join(uploadsDir, filename);
  fs.writeFileSync(fullPath, buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: `local:${filename}`,
    provider: 'local',
  };
}

export async function deleteUploadedImage(publicId: string): Promise<void> {
  if (!publicId) return;
  if (publicId.startsWith('local:')) {
    const filename = publicId.replace('local:', '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return;
  }

  if (hasCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.uploader.destroy(publicId).catch(() => undefined);
  }
}
