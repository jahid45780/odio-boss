import type {
  Banner,
  Brand,
  Category,
  Coupon,
  FooterConfig,
  HomepageConfig,
  InventoryLog,
  MediaAsset,
  NavigationConfig,
  Order,
  OrderItem,
  OrderStatus,
  PageContent,
  PaymentStatus,
  Product,
  ProductSpec,
  Review,
  SEOPageSetting,
  WebsiteSettings,
} from './types';
import {
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_NAVIGATION_CONFIG,
} from './cms-defaults';
import { mergeThemeConfig, type ThemeConfig } from './theme-defaults';

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

export function serializeProduct(row: Record<string, unknown>): Product {
  const price = Number(row.price ?? 0);
  const previousPrice = row.previousPrice !== null && row.previousPrice !== undefined ? Number(row.previousPrice) : null;
  const discountPercentage =
    previousPrice && previousPrice > price ? Math.round(((previousPrice - price) / previousPrice) * 100) : 0;

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    sku: String(row.sku),
    description: String(row.description),
    shortDescription: String(row.shortDescription ?? ''),
    price,
    previousPrice,
    discountPercentage,
    categoryId: String(row.categoryId),
    categoryName: row.categoryName ? String(row.categoryName) : undefined,
    categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
    brandId: String(row.brandId),
    brandName: row.brandName ? String(row.brandName) : undefined,
    brandSlug: row.brandSlug ? String(row.brandSlug) : undefined,
    stock: Number(row.stock ?? 0),
    soldCount: Number(row.soldCount ?? 0),
    ratingAverage: Number(row.ratingAverage ?? 0),
    ratingCount: Number(row.ratingCount ?? 0),
    images: safeJsonParse<string[]>(row.imagesJson, []),
    specs: safeJsonParse<ProductSpec[]>(row.specsJson, []),
    isFeatured: Boolean(row.isFeatured),
    isBestSeller: Boolean(row.isBestSeller),
    isNewArrival: Boolean(row.isNewArrival),
    isPublished: Boolean(row.isPublished),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export function serializeCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    imageUrl: String(row.imageUrl ?? ''),
    imagePublicId: String(row.imagePublicId ?? ''),
    isActive: Boolean(row.isActive),
    sortOrder: Number(row.sortOrder ?? 0),
    productCount: row.productCount !== undefined ? Number(row.productCount) : undefined,
    createdAt: String(row.createdAt),
  };
}

export function serializeBrand(row: Record<string, unknown>): Brand {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    logoUrl: String(row.logoUrl ?? ''),
    logoPublicId: String(row.logoPublicId ?? ''),
    isFeatured: Boolean(row.isFeatured),
    productCount: row.productCount !== undefined ? Number(row.productCount) : undefined,
    createdAt: String(row.createdAt),
  };
}

export function serializeOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    orderNumber: String(row.orderNumber),
    userId: row.userId ? String(row.userId) : null,
    customerName: String(row.customerName),
    customerEmail: String(row.customerEmail),
    customerPhone: String(row.customerPhone),
    shippingCountry: String(row.shippingCountry),
    shippingCity: String(row.shippingCity),
    shippingAddress: String(row.shippingAddress),
    postalCode: String(row.postalCode),
    items: safeJsonParse<OrderItem[]>(row.itemsJson, []),
    subtotal: Number(row.subtotal ?? 0),
    discountAmount: Number(row.discountAmount ?? 0),
    couponCode: String(row.couponCode ?? ''),
    shippingFee: Number(row.shippingFee ?? 0),
    totalAmount: Number(row.totalAmount ?? 0),
    paymentMethod: row.paymentMethod === 'ONLINE' ? 'ONLINE' : 'COD',
    paymentStatus: String(row.paymentStatus) as PaymentStatus,
    orderStatus: String(row.orderStatus) as OrderStatus,
    trackingNumber: String(row.trackingNumber ?? ''),
    notes: String(row.notes ?? ''),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export function serializeCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id),
    code: String(row.code),
    discountType: row.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    discountValue: Number(row.discountValue ?? 0),
    minOrderAmount: Number(row.minOrderAmount ?? 0),
    maxDiscountAmount: row.maxDiscountAmount !== null && row.maxDiscountAmount !== undefined ? Number(row.maxDiscountAmount) : null,
    usageLimit: row.usageLimit !== null && row.usageLimit !== undefined ? Number(row.usageLimit) : null,
    usedCount: Number(row.usedCount ?? 0),
    expiresAt: String(row.expiresAt),
    isActive: Boolean(row.isActive),
    createdAt: String(row.createdAt),
  };
}

export function serializeReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    productId: String(row.productId),
    productName: row.productName ? String(row.productName) : undefined,
    userId: row.userId ? String(row.userId) : null,
    authorName: String(row.authorName),
    rating: Number(row.rating ?? 5),
    title: String(row.title),
    comment: String(row.comment),
    status: String(row.status) as Review['status'],
    isVerifiedPurchase: Boolean(row.isVerifiedPurchase),
    createdAt: String(row.createdAt),
  };
}

export function serializeBanner(row: Record<string, unknown>): Banner {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: String(row.subtitle ?? ''),
    ctaText: String(row.ctaText ?? 'Explore Collection'),
    ctaLink: String(row.ctaLink ?? '/shop'),
    imageUrl: String(row.imageUrl),
    imagePublicId: String(row.imagePublicId ?? ''),
    placement: String(row.placement ?? 'PROMO'),
    displayOrder: Number(row.displayOrder ?? 0),
    isActive: Boolean(row.isActive),
    createdAt: String(row.createdAt),
  };
}

export function serializeInventoryLog(row: Record<string, unknown>): InventoryLog {
  return {
    id: String(row.id),
    productId: String(row.productId),
    productName: String(row.productName),
    sku: String(row.sku),
    previousStock: Number(row.previousStock ?? 0),
    changeAmount: Number(row.changeAmount ?? 0),
    newStock: Number(row.newStock ?? 0),
    reason: String(row.reason),
    actorName: String(row.actorName ?? 'System'),
    createdAt: String(row.createdAt),
  };
}

export function serializePageContent(row: Record<string, unknown>): PageContent {
  return {
    slug: String(row.slug),
    eyebrow: String(row.eyebrow ?? ''),
    title: String(row.title ?? ''),
    subtitle: String(row.subtitle ?? ''),
    heroImageUrl: String(row.heroImageUrl ?? ''),
    sections: safeJsonParse<Array<{ heading: string; body: string }>>(row.sectionsJson, []),
    faqItems: safeJsonParse<Array<{ question: string; answer: string }>>(row.faqItemsJson, []),
    updatedAt: String(row.updatedAt ?? ''),
  };
}

export function serializeSeoSetting(row: Record<string, unknown>): SEOPageSetting {
  return {
    pageKey: String(row.pageKey),
    label: String(row.label ?? row.pageKey),
    metaTitle: String(row.metaTitle ?? ''),
    metaDescription: String(row.metaDescription ?? ''),
    keywords: String(row.keywords ?? ''),
    ogImageUrl: String(row.ogImageUrl ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
  };
}

export function serializeMediaAsset(row: Record<string, unknown>): MediaAsset {
  return {
    id: String(row.id),
    url: String(row.url),
    publicId: String(row.publicId ?? ''),
    label: String(row.label ?? ''),
    category: (String(row.category || 'general') as MediaAsset['category']),
    provider: (String(row.provider || 'local') as MediaAsset['provider']),
    createdAt: String(row.createdAt ?? ''),
  };
}

export function serializeSettings(
  row: Record<string, unknown>,
  extras?: {
    themeRow?: Record<string, unknown>;
    navRow?: Record<string, unknown>;
    footerRow?: Record<string, unknown>;
    homepageRow?: Record<string, unknown>;
  }
): WebsiteSettings {
  const themeParsed = extras?.themeRow
    ? safeJsonParse<Partial<ThemeConfig>>(extras.themeRow.publishedConfigJson, {})
    : {};
  const draftParsed = extras?.themeRow?.draftConfigJson
    ? safeJsonParse<Partial<ThemeConfig> | null>(extras.themeRow.draftConfigJson, null)
    : null;

  const navConfig = extras?.navRow
    ? safeJsonParse<NavigationConfig>(extras.navRow.configJson, DEFAULT_NAVIGATION_CONFIG)
    : DEFAULT_NAVIGATION_CONFIG;

  const footerConfig = extras?.footerRow
    ? safeJsonParse<FooterConfig>(extras.footerRow.configJson, DEFAULT_FOOTER_CONFIG)
    : DEFAULT_FOOTER_CONFIG;

  const homepageConfig = extras?.homepageRow
    ? safeJsonParse<HomepageConfig>(extras.homepageRow.configJson, DEFAULT_HOMEPAGE_CONFIG)
    : DEFAULT_HOMEPAGE_CONFIG;

  return {
    id: String(row.id),
    siteName: String(row.siteName),
    tagline: String(row.tagline),
    logoUrl: String(row.logoUrl ?? ''),
    faviconUrl: String(row.faviconUrl ?? ''),
    contactEmail: String(row.contactEmail),
    contactPhone: String(row.contactPhone),
    address: String(row.address),
    currency: String(row.currency ?? 'USD'),
    currencySymbol: String(row.currencySymbol ?? '$'),
    shippingCharge: Number(row.shippingCharge ?? 0),
    freeShippingThreshold: Number(row.freeShippingThreshold ?? 0),
    announcementText: String(row.announcementText ?? ''),
    announcementActive: Boolean(row.announcementActive),
    heroTitle: String(row.heroTitle),
    heroSubtitle: String(row.heroSubtitle),
    heroImageUrl: String(row.heroImageUrl),
    footerAbout: String(row.footerAbout),
    socialLinks: safeJsonParse<Record<string, string>>(row.socialLinksJson, {}),
    homepageSections: safeJsonParse<Record<string, boolean>>(row.homepageSectionsJson, {}),
    themeConfig: mergeThemeConfig(themeParsed),
    themeDraftConfig: draftParsed ? mergeThemeConfig(draftParsed) : null,
    navigationConfig: {
      ...DEFAULT_NAVIGATION_CONFIG,
      ...navConfig,
      links: Array.isArray(navConfig.links) ? navConfig.links : DEFAULT_NAVIGATION_CONFIG.links,
    },
    footerConfig: {
      ...DEFAULT_FOOTER_CONFIG,
      ...footerConfig,
      columns: Array.isArray(footerConfig.columns) ? footerConfig.columns : DEFAULT_FOOTER_CONFIG.columns,
    },
    homepageConfig: {
      ...DEFAULT_HOMEPAGE_CONFIG,
      ...homepageConfig,
      sections: Array.isArray(homepageConfig.sections)
        ? homepageConfig.sections
        : DEFAULT_HOMEPAGE_CONFIG.sections,
    },
    updatedAt: String(row.updatedAt),
  };
}
