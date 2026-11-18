import type { ThemeConfig } from './theme-defaults';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  previousPrice: number | null;
  discountPercentage: number;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  brandId: string;
  brandName?: string;
  brandSlug?: string;
  stock: number;
  soldCount: number;
  ratingAverage: number;
  ratingCount: number;
  images: string[];
  specs: ProductSpec[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  logoPublicId: string;
  isFeatured: boolean;
  productCount?: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCountry: string;
  shippingCity: string;
  shippingAddress: string;
  postalCode: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode: string;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId: string | null;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imagePublicId: string;
  placement: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  changeAmount: number;
  newStock: number;
  reason: string;
  actorName: string;
  createdAt: string;
}

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface NavigationConfig {
  headerStyle: 'blur' | 'solid' | 'transparent';
  stickyHeader: boolean;
  links: NavLinkItem[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface FooterConfig {
  copyrightText: string;
  newsletterEyebrow: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterButtonText: string;
  columns: FooterColumn[];
}

export type HomepageSectionKey =
  | 'collections'
  | 'categories'
  | 'promoBanner'
  | 'whySoniq'
  | 'brands'
  | 'reviews'
  | 'newsletter';

export interface HomepageSectionConfig {
  key: HomepageSectionKey;
  eyebrow: string;
  title: string;
  description: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface HomepageConfig {
  heroBackgroundImageUrl: string;
  heroPrimaryCtaText: string;
  heroPrimaryCtaUrl: string;
  heroSecondaryCtaText: string;
  heroSecondaryCtaUrl: string;
  featuredProductIds: string[];
  bestSellerProductIds: string[];
  newArrivalProductIds: string[];
  sections: HomepageSectionConfig[];
}

export interface PageContent {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImageUrl: string;
  sections: Array<{ heading: string; body: string }>;
  faqItems: Array<{ question: string; answer: string }>;
  updatedAt: string;
}

export interface SEOPageSetting {
  pageKey: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImageUrl: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  publicId: string;
  label: string;
  category: 'logo' | 'banner' | 'background' | 'product' | 'general';
  provider: 'cloudinary' | 'local' | 'builtin';
  createdAt: string;
}

export interface WebsiteSettings {
  id: string;
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  shippingCharge: number;
  freeShippingThreshold: number;
  announcementText: string;
  announcementActive: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  footerAbout: string;
  socialLinks: Record<string, string>;
  homepageSections: Record<string, boolean>;
  themeConfig: ThemeConfig;
  themeDraftConfig: ThemeConfig | null;
  navigationConfig: NavigationConfig;
  footerConfig: FooterConfig;
  homepageConfig: HomepageConfig;
  updatedAt: string;
}
