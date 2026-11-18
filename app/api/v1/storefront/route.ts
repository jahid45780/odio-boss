import { getDb } from '@/lib/db';
import { getWebsiteSettingsSafe, pickCuratedProducts } from '@/lib/cms-server';
import {
  serializeBanner,
  serializeBrand,
  serializeCategory,
  serializeProduct,
  serializeReview,
} from '@/lib/serializers';
import { ok, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
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

    const featured = pickCuratedProducts(allPublished, hp.featuredProductIds, (p) => p.isFeatured);
    const bestSellers = pickCuratedProducts(
      [...allPublished].sort((a, b) => b.soldCount - a.soldCount),
      hp.bestSellerProductIds,
      (p) => p.isBestSeller
    );
    const newArrivals = pickCuratedProducts(allPublished, hp.newArrivalProductIds, (p) => p.isNewArrival);

    const categories = db
      .prepare(`
        SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id AND p.isPublished = 1) as productCount
        FROM categories c
        WHERE c.isActive = 1
        ORDER BY c.sortOrder ASC, c.name ASC
      `)
      .all()
      .map(serializeCategory);

    const brands = db
      .prepare(`
        SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brandId = b.id AND p.isPublished = 1) as productCount
        FROM brands b
        WHERE b.isFeatured = 1
        ORDER BY b.name ASC
      `)
      .all()
      .map(serializeBrand);

    const banners = db
      .prepare('SELECT * FROM banners WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt DESC')
      .all()
      .map(serializeBanner);

    const reviews = db
      .prepare(`
        SELECT r.*, p.name as productName
        FROM reviews r
        LEFT JOIN products p ON r.productId = p.id
        WHERE r.status = 'APPROVED'
        ORDER BY r.createdAt DESC
        LIMIT 6
      `)
      .all()
      .map(serializeReview);

    return ok({
      settings,
      featured,
      bestSellers,
      newArrivals,
      categories,
      brands,
      banners,
      reviews,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
