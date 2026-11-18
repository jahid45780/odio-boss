import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getWebsiteSettingsSafe } from '@/lib/cms-server';
import { serializeProduct, serializeReview } from '@/lib/serializers';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';

export const dynamic = 'force-dynamic';

function loadProductBySlug(slug: string) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      LEFT JOIN brands b ON p.brandId = b.id
      WHERE p.slug = ? OR p.id = ?
    `)
    .get(slug, slug) as Record<string, unknown> | undefined;

  if (!row) return null;
  return serializeProduct(row);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = loadProductBySlug(slug);
  if (!product) return { title: 'Speaker Not Found' };

  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 155),
    openGraph: {
      title: `${product.name} | SONIQ`,
      description: product.shortDescription || product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = loadProductBySlug(slug);
  if (!product) notFound();

  const db = getDb();
  const settings = getWebsiteSettingsSafe();

  const reviews = db
    .prepare("SELECT * FROM reviews WHERE productId = ? AND status = 'APPROVED' ORDER BY createdAt DESC")
    .all(product.id)
    .map(serializeReview);

  const related = db
    .prepare(`
      SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      LEFT JOIN brands b ON p.brandId = b.id
      WHERE p.isPublished = 1 AND p.id != ? AND (p.categoryId = ? OR p.brandId = ?)
      ORDER BY p.isFeatured DESC, p.soldCount DESC
      LIMIT 4
    `)
    .all(product.id, product.categoryId, product.brandId)
    .map(serializeProduct);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brandName || 'SONIQ' },
    offers: {
      '@type': 'Offer',
      priceCurrency: settings.currency,
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <StorefrontShell initialSettings={settings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        product={product}
        reviews={reviews}
        related={related}
        currencySymbol={settings.currencySymbol}
      />
    </StorefrontShell>
  );
}
