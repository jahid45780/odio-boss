import { getDb } from '@/lib/db';
import {
  buildPageMetadata,
  getWebsiteSettingsSafe,
  pickCuratedProducts,
} from '@/lib/cms-server';
import {
  serializeBanner,
  serializeBrand,
  serializeCategory,
  serializeProduct,
  serializeReview,
} from '@/lib/serializers';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { HomeView, type StorefrontPayload } from '@/components/storefront/HomeView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildPageMetadata('home');
}

function getInitialStorefrontData(): StorefrontPayload {
  const db = getDb();
  const settings = getWebsiteSettingsSafe();

  const productSelect = `
    SELECT p.*, c.name as categoryName, c.slug as categorySlug, b.name as brandName, b.slug as brandSlug
    FROM products p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN brands b ON p.brandId = b.id
    WHERE p.isPublished = 1
    ORDER BY p.createdAt DESC
  `;

  const allPublished = db.prepare(productSelect).all().map(serializeProduct);
  const hp = settings.homepageConfig;

  return {
    settings,
    featured: pickCuratedProducts(allPublished, hp.featuredProductIds, (p) => p.isFeatured),
    bestSellers: pickCuratedProducts(
      [...allPublished].sort((a, b) => b.soldCount - a.soldCount),
      hp.bestSellerProductIds,
      (p) => p.isBestSeller
    ),
    newArrivals: pickCuratedProducts(allPublished, hp.newArrivalProductIds, (p) => p.isNewArrival),
    categories: db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id AND p.isPublished = 1) as productCount FROM categories c WHERE c.isActive = 1 ORDER BY c.sortOrder ASC`
      )
      .all()
      .map(serializeCategory),
    brands: db
      .prepare(
        `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brandId = b.id AND p.isPublished = 1) as productCount FROM brands b WHERE b.isFeatured = 1 ORDER BY b.name ASC`
      )
      .all()
      .map(serializeBrand),
    banners: db.prepare('SELECT * FROM banners WHERE isActive = 1 ORDER BY displayOrder ASC').all().map(serializeBanner),
    reviews: db
      .prepare(
        `SELECT r.*, p.name as productName FROM reviews r LEFT JOIN products p ON r.productId = p.id WHERE r.status = 'APPROVED' ORDER BY r.createdAt DESC LIMIT 6`
      )
      .all()
      .map(serializeReview),
  };
}

export default function HomePage() {
  const initialData = getInitialStorefrontData();
  return (
    <StorefrontShell initialSettings={initialData.settings}>
      <HomeView initialData={initialData} />
    </StorefrontShell>
  );
}
