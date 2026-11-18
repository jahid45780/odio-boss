import type { MetadataRoute } from 'next';
import { getSafeSiteUrl } from '@/lib/cms-server';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSafeSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
