import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { getSafeSiteUrl } from '@/lib/cms-server';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSafeSiteUrl();
  const db = getDb();
  const products = db
    .prepare('SELECT slug, updatedAt FROM products WHERE isPublished = 1')
    .all() as Array<{ slug: string; updatedAt: string }>;

  const staticRoutes = ['', '/shop', '/about', '/contact', '/faq', '/privacy-policy', '/terms', '/shipping-policy', '/return-policy'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
    })
  );

  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.updatedAt),
  }));

  return [...staticRoutes, ...productRoutes];
}
