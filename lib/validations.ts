import { z } from 'zod';
import { isValidCssColor, sanitizeText, sanitizeUrl } from './sanitize';

const cssColorField = z
  .string()
  .trim()
  .refine(isValidCssColor, 'Invalid CSS color format. Use #HEX or rgb()/rgba().');

const safeString = (max = 500) =>
  z
    .string()
    .max(max)
    .transform((v) => sanitizeText(v));

const safeUrlField = z
  .string()
  .trim()
  .max(500)
  .transform((v) => sanitizeUrl(v));

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Valid email address required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().trim().max(30).optional().default(''),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().default(''),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, 'Label is required').max(40),
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(5).max(30),
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(4).max(200),
  postalCode: z.string().trim().min(2).max(20),
  isDefault: z.boolean().optional().default(false),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(140),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(2, 'SKU is required').max(60),
  description: z.string().trim().min(10, 'Description is required'),
  shortDescription: z.string().trim().max(300).optional().default(''),
  price: z.coerce.number().positive('Price must be greater than 0'),
  previousPrice: z.coerce.number().nonnegative().nullable().optional(),
  categoryId: z.string().trim().min(1, 'Category is required'),
  brandId: z.string().trim().min(1, 'Brand is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(z.string().trim().min(1)).min(1, 'At least one image is required'),
  specs: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
      })
    )
    .optional()
    .default([]),
  isFeatured: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(80),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(400).optional().default(''),
  imageUrl: z.string().trim().optional().default(''),
  imagePublicId: z.string().trim().optional().default(''),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const brandSchema = z.object({
  name: z.string().trim().min(2, 'Brand name is required').max(80),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(400).optional().default(''),
  logoUrl: z.string().trim().optional().default(''),
  logoPublicId: z.string().trim().optional().default(''),
  isFeatured: z.boolean().optional().default(true),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(32).transform((v) => v.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0).optional().default(0),
  maxDiscountAmount: z.coerce.number().positive().nullable().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.string().min(4),
  isActive: z.boolean().optional().default(true),
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required').max(100),
  customerEmail: z.string().trim().email('Valid email is required'),
  customerPhone: z.string().trim().min(5, 'Phone number is required').max(30),
  shippingCountry: z.string().trim().min(2, 'Country is required').max(80),
  shippingCity: z.string().trim().min(2, 'City is required').max(80),
  shippingAddress: z.string().trim().min(5, 'Street address is required').max(250),
  postalCode: z.string().trim().min(2, 'Postal code is required').max(25),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
      })
    )
    .min(1, 'Cart cannot be empty'),
  couponCode: z.string().trim().optional().default(''),
  paymentMethod: z.enum(['COD', 'ONLINE']).default('COD'),
  notes: z.string().trim().max(500).optional().default(''),
});

export const orderStatusUpdateSchema = z.object({
  orderStatus: z.enum(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  comment: z.string().trim().min(6).max(1200),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(2).max(140),
  subtitle: z.string().trim().max(400).optional().default(''),
  ctaText: z.string().trim().max(60).optional().default('Explore Collection'),
  ctaLink: z.string().trim().max(250).optional().default('/shop'),
  imageUrl: z.string().trim().min(1, 'Banner image is required'),
  imagePublicId: z.string().trim().optional().default(''),
  placement: z.string().trim().optional().default('PROMO'),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const themePaletteSchema = z.object({
  background: cssColorField,
  secondaryBackground: cssColorField,
  cardBackground: cssColorField,
  elevatedBackground: cssColorField,
  textPrimary: cssColorField,
  textSecondary: cssColorField,
  accentPrimary: cssColorField,
  accentSecondary: cssColorField,
  buttonBg: cssColorField,
  buttonText: cssColorField,
  border: cssColorField,
});

export const themeConfigSchema = z.object({
  defaultTheme: z.enum(['dark', 'light', 'system']),
  enableDarkTheme: z.boolean(),
  enableLightTheme: z.boolean(),
  darkPalette: themePaletteSchema,
  lightPalette: themePaletteSchema,
  typography: z.object({
    displayFont: z.enum(['outfit', 'manrope', 'plus_jakarta', 'dm_sans', 'urbanist']),
    bodyFont: z.enum(['outfit', 'manrope', 'plus_jakarta', 'dm_sans', 'urbanist']),
    baseSizeScale: z.enum(['compact', 'standard', 'large']),
  }),
  layout: z.object({
    borderRadius: z.enum(['sharp', 'medium', 'rounded', 'soft']),
    sectionSpacing: z.enum(['compact', 'balanced', 'spacious']),
  }),
}).refine((v) => v.enableDarkTheme || v.enableLightTheme, {
  message: 'At least one theme (Dark or Light) must remain enabled.',
});

export const navigationConfigSchema = z.object({
  headerStyle: z.enum(['blur', 'solid', 'transparent']),
  stickyHeader: z.boolean(),
  links: z.array(
    z.object({
      id: safeString(40),
      label: safeString(40).refine((v) => v.length >= 1, 'Link label required'),
      href: safeUrlField.refine((v) => v.length >= 1, 'Valid link URL required'),
      isVisible: z.boolean(),
      sortOrder: z.coerce.number().int(),
    })
  ),
});

export const footerConfigSchema = z.object({
  copyrightText: safeString(200),
  newsletterEyebrow: safeString(80),
  newsletterTitle: safeString(200),
  newsletterSubtitle: safeString(300),
  newsletterButtonText: safeString(40),
  columns: z.array(
    z.object({
      id: safeString(40),
      title: safeString(60),
      links: z.array(
        z.object({
          label: safeString(60),
          href: safeUrlField.refine((v) => v.length >= 1, 'Valid link URL required'),
        })
      ),
    })
  ),
});

export const homepageConfigSchema = z.object({
  heroBackgroundImageUrl: safeUrlField,
  heroPrimaryCtaText: safeString(60),
  heroPrimaryCtaUrl: safeUrlField,
  heroSecondaryCtaText: safeString(60),
  heroSecondaryCtaUrl: safeUrlField,
  featuredProductIds: z.array(z.string().trim()).default([]),
  bestSellerProductIds: z.array(z.string().trim()).default([]),
  newArrivalProductIds: z.array(z.string().trim()).default([]),
  sections: z.array(
    z.object({
      key: z.enum(['collections', 'categories', 'promoBanner', 'whySoniq', 'brands', 'reviews', 'newsletter']),
      eyebrow: safeString(80),
      title: safeString(160),
      description: safeString(400),
      isVisible: z.boolean(),
      sortOrder: z.coerce.number().int(),
    })
  ),
});

export const pageContentSchema = z.object({
  slug: z.enum(['about', 'contact', 'faq', 'privacy-policy', 'terms', 'shipping-policy', 'return-policy']),
  eyebrow: safeString(80),
  title: safeString(160),
  subtitle: safeString(500),
  heroImageUrl: safeUrlField,
  sections: z.array(
    z.object({
      heading: safeString(160),
      body: safeString(4000),
    })
  ),
  faqItems: z
    .array(
      z.object({
        question: safeString(240),
        answer: safeString(2000),
      })
    )
    .default([]),
});

export const seoPageSchema = z.object({
  pageKey: z.string().trim().min(1).max(60),
  label: safeString(80),
  metaTitle: safeString(160),
  metaDescription: safeString(320),
  keywords: safeString(300),
  ogImageUrl: safeUrlField,
});

export const settingsSchema = z.object({
  siteName: safeString(60).refine((v) => v.length >= 1),
  tagline: safeString(120),
  logoUrl: safeUrlField.optional().default(''),
  faviconUrl: safeUrlField.optional().default(''),
  contactEmail: z.string().trim().email(),
  contactPhone: safeString(40),
  address: safeString(250),
  currency: safeString(5),
  currencySymbol: safeString(4),
  shippingCharge: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0),
  announcementText: safeString(300),
  announcementActive: z.boolean(),
  heroTitle: safeString(160),
  heroSubtitle: safeString(400),
  heroImageUrl: safeUrlField,
  footerAbout: safeString(500),
  socialLinks: z.record(z.string(), safeUrlField).optional(),
  homepageSections: z.record(z.string(), z.boolean()).optional(),
  themeConfig: themeConfigSchema.optional(),
  themeDraftConfig: themeConfigSchema.nullable().optional(),
  navigationConfig: navigationConfigSchema.optional(),
  footerConfig: footerConfigSchema.optional(),
  homepageConfig: homepageConfigSchema.optional(),
});
