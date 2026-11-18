import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { DEFAULT_THEME_CONFIG } from './theme-defaults';
import {
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_NAVIGATION_CONFIG,
  DEFAULT_PAGES,
  DEFAULT_SEO_SETTINGS,
} from './cms-defaults';

function resolveDataDir(): string {
  const primary = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(primary, { recursive: true });
    fs.accessSync(primary, fs.constants.W_OK);
    return primary;
  } catch {
    const fallback = path.join(os.tmpdir(), 'soniq-data');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

declare global {
  var __soniqDb: DatabaseSync | undefined;
  var __soniqDbSeeded: boolean | undefined;
}

function getDbInstance(): DatabaseSync {
  if (!globalThis.__soniqDb) {
    const dataDir = resolveDataDir();
    const dbPath = path.join(dataDir, 'soniq.db');
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema(db);
    seedDatabaseIfEmpty(db);
    globalThis.__soniqDb = db;
  }
  return globalThis.__soniqDb;
}

export function getDb(): DatabaseSync {
  return getDbInstance();
}

export function genId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER', 'ADMIN')),
      phone TEXT DEFAULT '',
      isBlocked INTEGER NOT NULL DEFAULT 0,
      addressesJson TEXT NOT NULL DEFAULT '[]',
      resetTokenHash TEXT DEFAULT NULL,
      resetTokenExpiry INTEGER DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      imagePublicId TEXT DEFAULT '',
      isActive INTEGER NOT NULL DEFAULT 1,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      logoUrl TEXT DEFAULT '',
      logoPublicId TEXT DEFAULT '',
      isFeatured INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      shortDescription TEXT DEFAULT '',
      price REAL NOT NULL,
      previousPrice REAL DEFAULT NULL,
      categoryId TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      brandId TEXT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
      stock INTEGER NOT NULL DEFAULT 0,
      soldCount INTEGER NOT NULL DEFAULT 0,
      ratingAverage REAL NOT NULL DEFAULT 0,
      ratingCount INTEGER NOT NULL DEFAULT 0,
      imagesJson TEXT NOT NULL DEFAULT '[]',
      specsJson TEXT NOT NULL DEFAULT '[]',
      isFeatured INTEGER NOT NULL DEFAULT 0,
      isBestSeller INTEGER NOT NULL DEFAULT 0,
      isNewArrival INTEGER NOT NULL DEFAULT 0,
      isPublished INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoryId);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brandId);
    CREATE INDEX IF NOT EXISTS idx_products_published ON products(isPublished);

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discountType TEXT NOT NULL CHECK(discountType IN ('PERCENTAGE', 'FIXED')),
      discountValue REAL NOT NULL,
      minOrderAmount REAL NOT NULL DEFAULT 0,
      maxDiscountAmount REAL DEFAULT NULL,
      usageLimit INTEGER DEFAULT NULL,
      usedCount INTEGER NOT NULL DEFAULT 0,
      expiresAt TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL UNIQUE,
      userId TEXT REFERENCES users(id) ON DELETE SET NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      shippingCountry TEXT NOT NULL,
      shippingCity TEXT NOT NULL,
      shippingAddress TEXT NOT NULL,
      postalCode TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discountAmount REAL NOT NULL DEFAULT 0,
      couponCode TEXT DEFAULT '',
      shippingFee REAL NOT NULL DEFAULT 0,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL CHECK(paymentMethod IN ('COD', 'ONLINE')),
      paymentStatus TEXT NOT NULL DEFAULT 'PENDING' CHECK(paymentStatus IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
      orderStatus TEXT NOT NULL DEFAULT 'Pending' CHECK(orderStatus IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
      trackingNumber TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(orderStatus);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(createdAt);

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      userId TEXT REFERENCES users(id) ON DELETE SET NULL,
      authorName TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      isVerifiedPurchase INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(productId);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      ctaText TEXT DEFAULT 'Explore Collection',
      ctaLink TEXT DEFAULT '/shop',
      imageUrl TEXT NOT NULL,
      imagePublicId TEXT DEFAULT '',
      placement TEXT NOT NULL DEFAULT 'PROMO',
      displayOrder INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      productName TEXT NOT NULL,
      sku TEXT NOT NULL,
      previousStock INTEGER NOT NULL,
      changeAmount INTEGER NOT NULL,
      newStock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      actorName TEXT DEFAULT 'System',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      id TEXT PRIMARY KEY,
      siteName TEXT NOT NULL,
      tagline TEXT NOT NULL,
      logoUrl TEXT DEFAULT '',
      faviconUrl TEXT DEFAULT '',
      contactEmail TEXT NOT NULL,
      contactPhone TEXT NOT NULL,
      address TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      currencySymbol TEXT NOT NULL DEFAULT '$',
      shippingCharge REAL NOT NULL DEFAULT 25,
      freeShippingThreshold REAL NOT NULL DEFAULT 500,
      announcementText TEXT NOT NULL,
      announcementActive INTEGER NOT NULL DEFAULT 1,
      heroTitle TEXT NOT NULL,
      heroSubtitle TEXT NOT NULL,
      heroImageUrl TEXT NOT NULL,
      footerAbout TEXT NOT NULL,
      socialLinksJson TEXT NOT NULL,
      homepageSectionsJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS theme_settings (
      id TEXT PRIMARY KEY,
      publishedConfigJson TEXT NOT NULL,
      draftConfigJson TEXT DEFAULT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS navigation_settings (
      id TEXT PRIMARY KEY,
      configJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS footer_settings (
      id TEXT PRIMARY KEY,
      configJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homepage_sections (
      id TEXT PRIMARY KEY,
      configJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_contents (
      slug TEXT PRIMARY KEY,
      eyebrow TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      heroImageUrl TEXT NOT NULL DEFAULT '',
      sectionsJson TEXT NOT NULL DEFAULT '[]',
      faqItemsJson TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seo_settings (
      pageKey TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      metaTitle TEXT NOT NULL,
      metaDescription TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '',
      ogImageUrl TEXT NOT NULL DEFAULT '',
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      publicId TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      provider TEXT NOT NULL DEFAULT 'local',
      createdAt TEXT NOT NULL
    );
  `);
}

function seedDatabaseIfEmpty(db: DatabaseSync) {
  if (globalThis.__soniqDbSeeded) return;
  globalThis.__soniqDbSeeded = true;

  const now = new Date().toISOString();

  // Seed admin from environment variables if configured and not already present
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim() || 'SONIQ Administrator';
  if (adminEmail && adminPassword) {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existingAdmin) {
      const hash = bcrypt.hashSync(adminPassword, 12);
      db.prepare(`
        INSERT INTO users (id, name, email, passwordHash, role, phone, isBlocked, addressesJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 'ADMIN', '', 0, '[]', ?, ?)
      `).run(genId(), adminName, adminEmail, hash, now, now);
    }
  }

  // Ensure default website settings row exists
  const settingsRow = db.prepare('SELECT id FROM website_settings WHERE id = ?').get('default');
  if (!settingsRow) {
    db.prepare(`
      INSERT INTO website_settings (
        id, siteName, tagline, logoUrl, faviconUrl, contactEmail, contactPhone, address,
        currency, currencySymbol, shippingCharge, freeShippingThreshold,
        announcementText, announcementActive, heroTitle, heroSubtitle, heroImageUrl,
        footerAbout, socialLinksJson, homepageSectionsJson, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default',
      'SONIQ',
      'Precision Acoustic Engineering',
      '',
      '',
      'concierge@soniq-audio.com',
      '+1 (415) 890-4420',
      '740 Harrison Acoustic Way, San Francisco, CA 94107',
      'USD',
      '$',
      35,
      500,
      'Complimentary express calibration & insured delivery on orders over $500 · Use code SONIQ10 for 10% off your first system.',
      1,
      'Experience Sound Beyond Limits.',
      'Discover powerful audio technology designed to transform every moment into an unforgettable experience.',
      '/images/hero-flagship.jpg',
      'Engineered in San Francisco and Munich, SONIQ crafts reference-grade loudspeaker architecture for discerning studios and private listening sanctuaries.',
      JSON.stringify({
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com',
        x: 'https://x.com',
        linkedin: 'https://linkedin.com',
      }),
      JSON.stringify({
        showFeatured: true,
        showBestSellers: true,
        showNewArrivals: true,
        showCategories: true,
        showBrands: true,
        showPromoBanner: true,
        showWhySoniq: true,
        showReviews: true,
        showNewsletter: true,
      }),
      now
    );
  }

  // Idempotent CMS & Theme tables seeding (runs even if products already exist)
  if (!db.prepare('SELECT id FROM theme_settings WHERE id = ?').get('default')) {
    db.prepare('INSERT INTO theme_settings (id, publishedConfigJson, draftConfigJson, updatedAt) VALUES (?, ?, NULL, ?)').run(
      'default',
      JSON.stringify(DEFAULT_THEME_CONFIG),
      now
    );
  }
  if (!db.prepare('SELECT id FROM navigation_settings WHERE id = ?').get('default')) {
    db.prepare('INSERT INTO navigation_settings (id, configJson, updatedAt) VALUES (?, ?, ?)').run(
      'default',
      JSON.stringify(DEFAULT_NAVIGATION_CONFIG),
      now
    );
  }
  if (!db.prepare('SELECT id FROM footer_settings WHERE id = ?').get('default')) {
    db.prepare('INSERT INTO footer_settings (id, configJson, updatedAt) VALUES (?, ?, ?)').run(
      'default',
      JSON.stringify(DEFAULT_FOOTER_CONFIG),
      now
    );
  }
  if (!db.prepare('SELECT id FROM homepage_sections WHERE id = ?').get('default')) {
    db.prepare('INSERT INTO homepage_sections (id, configJson, updatedAt) VALUES (?, ?, ?)').run(
      'default',
      JSON.stringify(DEFAULT_HOMEPAGE_CONFIG),
      now
    );
  }

  const upsertPageStmt = db.prepare(`
    INSERT OR IGNORE INTO page_contents (slug, eyebrow, title, subtitle, heroImageUrl, sectionsJson, faqItemsJson, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const page of DEFAULT_PAGES) {
    upsertPageStmt.run(
      page.slug,
      page.eyebrow,
      page.title,
      page.subtitle,
      page.heroImageUrl,
      JSON.stringify(page.sections),
      JSON.stringify(page.faqItems),
      now
    );
  }

  const upsertSeoStmt = db.prepare(`
    INSERT OR IGNORE INTO seo_settings (pageKey, label, metaTitle, metaDescription, keywords, ogImageUrl, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const seo of DEFAULT_SEO_SETTINGS) {
    upsertSeoStmt.run(
      seo.pageKey,
      seo.label,
      seo.metaTitle,
      seo.metaDescription,
      seo.keywords,
      seo.ogImageUrl,
      now
    );
  }

  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media_assets').get() as { count: number };
  if (mediaCount.count === 0) {
    const builtinAssets = [
      { id: 'media_hero', url: '/images/hero-flagship.jpg', label: 'Flagship Monolith Hero', category: 'banner' },
      { id: 'media_studio', url: '/images/studio-monitor.jpg', label: 'Carbon Studio Monitor', category: 'product' },
      { id: 'media_bookshelf', url: '/images/bookshelf-pair.jpg', label: 'Aurelia Bookshelf Pair', category: 'product' },
      { id: 'media_soundbar', url: '/images/cinema-soundbar.jpg', label: 'Strata Cinema Soundbar', category: 'banner' },
      { id: 'media_sub', url: '/images/reference-subwoofer.jpg', label: 'SubZero Reference Woofer', category: 'product' },
      { id: 'media_portable', url: '/images/portable-cylinder.jpg', label: 'Pulse 360 Portable', category: 'product' },
    ];
    const insertMedia = db.prepare(
      'INSERT INTO media_assets (id, url, publicId, label, category, provider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const m of builtinAssets) {
      insertMedia.run(m.id, m.url, '', m.label, m.category, 'builtin', now);
    }
  }

  const productCountRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCountRow.count > 0) return;

  // Seed Categories
  const categories = [
    {
      id: 'cat_floorstanding',
      name: 'Floorstanding Towers',
      slug: 'floorstanding-towers',
      description: 'Full-range architectural acoustic monoliths engineered for reference listening rooms.',
      imageUrl: '/images/hero-flagship.jpg',
      sortOrder: 1,
    },
    {
      id: 'cat_studio',
      name: 'Studio Monitors',
      slug: 'studio-monitors',
      description: 'Phase-coherent nearfield and midfield monitors for mastering precision.',
      imageUrl: '/images/studio-monitor.jpg',
      sortOrder: 2,
    },
    {
      id: 'cat_bookshelf',
      name: 'Bookshelf Systems',
      slug: 'bookshelf-systems',
      description: 'Compact wireless and passive audiophile loudspeakers with carbon-waveguide dispersion.',
      imageUrl: '/images/bookshelf-pair.jpg',
      sortOrder: 3,
    },
    {
      id: 'cat_soundbars',
      name: 'Cinema Soundbars',
      slug: 'cinema-soundbars',
      description: 'Spatial Dolby Atmos architectural bars with machined titanium enclosures.',
      imageUrl: '/images/cinema-soundbar.jpg',
      sortOrder: 4,
    },
    {
      id: 'cat_subwoofers',
      name: 'Subwoofers',
      slug: 'subwoofers',
      description: 'Dual-force-canceling sub-bass engines delivering distortion-free 18Hz depth.',
      imageUrl: '/images/reference-subwoofer.jpg',
      sortOrder: 5,
    },
    {
      id: 'cat_portable',
      name: 'Portable Wireless',
      slug: 'portable-wireless',
      description: '360-degree omnidirectional battery speakers built from anodized aluminum and acoustic weave.',
      imageUrl: '/images/portable-cylinder.jpg',
      sortOrder: 6,
    },
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, description, imageUrl, imagePublicId, isActive, sortOrder, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, '', 1, ?, ?, ?)
  `);
  for (const c of categories) {
    insertCat.run(c.id, c.name, c.slug, c.description, c.imageUrl, c.sortOrder, now, now);
  }

  // Seed Brands
  const brands = [
    { id: 'brand_soniq', name: 'SONIQ Labs', slug: 'soniq-labs', description: 'Flagship in-house acoustic engineering division.' },
    { id: 'brand_krono', name: 'Krono Acoustics', slug: 'krono-acoustics', description: 'Swiss precision transducers and room DSP.' },
    { id: 'brand_nord', name: 'Nordic Wave', slug: 'nordic-wave', description: 'Scandinavian minimalist cabinetry and wireless protocols.' },
    { id: 'brand_aether', name: 'Aether Pro', slug: 'aether-pro', description: 'Mastering-grade active amplification and studio monitors.' },
  ];

  const insertBrand = db.prepare(`
    INSERT INTO brands (id, name, slug, description, logoUrl, logoPublicId, isFeatured, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, '', '', 1, ?, ?)
  `);
  for (const b of brands) {
    insertBrand.run(b.id, b.name, b.slug, b.description, now, now);
  }

  // Seed Products
  const products = [
    {
      id: 'prod_monolith_x1',
      name: 'SONIQ Monolith X1 Reference',
      slug: 'soniq-monolith-x1-reference',
      sku: 'SNQ-MX1-001',
      shortDescription: 'Active 4-way flagship acoustic tower with CNC aluminum waveguide and 1800W Class-D bi-amping.',
      description: 'The SONIQ Monolith X1 Reference represents our pinnacle in spatial acoustic architecture. Machined from aerospace-grade anodized aluminum with an integrated circular constant-directivity waveguide, the X1 projects a holographic soundstage down to 22Hz with near-zero cabinet resonance.',
      price: 4299,
      previousPrice: 4899,
      categoryId: 'cat_floorstanding',
      brandId: 'brand_soniq',
      stock: 14,
      soldCount: 48,
      ratingAverage: 4.9,
      ratingCount: 2,
      images: ['/images/hero-flagship.jpg', '/images/studio-monitor.jpg'],
      specs: [
        { label: 'Frequency Response', value: '22 Hz – 40 kHz (±1.5 dB)' },
        { label: 'Amplification', value: '1800W Quad-Channel Class-D' },
        { label: 'Peak SPL', value: '118 dB @ 1m' },
        { label: 'Cabinet Material', value: 'CNC Anodized 6061 Aluminum' },
        { label: 'Connectivity', value: 'WiSA, AES/EBU, XLR, AirPlay 2, Tidal Connect' },
        { label: 'Dimensions', value: '1180 × 310 × 420 mm · 46.5 kg' },
      ],
      isFeatured: 1,
      isBestSeller: 1,
      isNewArrival: 1,
    },
    {
      id: 'prod_apex_m8',
      name: 'Apex M8 Carbon Studio Monitor',
      slug: 'apex-m8-carbon-studio-monitor',
      sku: 'SNQ-AM8-002',
      shortDescription: 'Tri-amplified 8-inch carbon-weave reference monitor with room-adaptive FIR phase calibration.',
      description: 'Built for mastering engineers and hyper-critical listeners, the Apex M8 pairs a rigid woven carbon-fiber low-frequency driver with a beryllium dome tweeter encircled by an acoustic dispersion ring. Integrated 96kHz/24-bit DSP neutralizes room boundary reflections in seconds.',
      price: 1499,
      previousPrice: 1750,
      categoryId: 'cat_studio',
      brandId: 'brand_aether',
      stock: 28,
      soldCount: 92,
      ratingAverage: 4.8,
      ratingCount: 1,
      images: ['/images/studio-monitor.jpg', '/images/bookshelf-pair.jpg'],
      specs: [
        { label: 'Frequency Response', value: '32 Hz – 35 kHz (±1.0 dB)' },
        { label: 'LF / HF Power', value: '300W + 150W Bi-Amplified' },
        { label: 'Transducers', value: '8" Woven Carbon / 1.1" Beryllium' },
        { label: 'Inputs', value: 'Balanced XLR, TRS, Optical S/PDIF' },
        { label: 'Weight', value: '13.8 kg per unit' },
      ],
      isFeatured: 1,
      isBestSeller: 1,
      isNewArrival: 0,
    },
    {
      id: 'prod_aurelia_duo',
      name: 'Aurelia Duo Wireless Bookshelf',
      slug: 'aurelia-duo-wireless-bookshelf',
      sku: 'SNQ-AD2-003',
      shortDescription: 'Matched pair of lossless 24-bit/192kHz active bookshelf speakers in satin obsidian finish.',
      description: 'Aurelia Duo bridges high-precision studio clarity with effortless living-space integration. Ultra-low-latency wireless inter-speaker link transmits uncompressed 24-bit/192kHz audio between channels while HDMI eARC, USB-C DAC, and Bluetooth 5.4 AptX Lossless handle every source.',
      price: 1199,
      previousPrice: 1399,
      categoryId: 'cat_bookshelf',
      brandId: 'brand_nord',
      stock: 35,
      soldCount: 114,
      ratingAverage: 4.9,
      ratingCount: 1,
      images: ['/images/bookshelf-pair.jpg', '/images/studio-monitor.jpg'],
      specs: [
        { label: 'Frequency Response', value: '38 Hz – 28 kHz' },
        { label: 'Total System Power', value: '560W RMS' },
        { label: 'Wireless Protocol', value: 'Wi-Fi 6E, AirPlay 2, Bluetooth 5.4' },
        { label: 'Inputs', value: 'HDMI eARC, Optical, USB-C, RCA Phono' },
        { label: 'Dimensions', value: '320 × 195 × 245 mm (each)' },
      ],
      isFeatured: 1,
      isBestSeller: 1,
      isNewArrival: 1,
    },
    {
      id: 'prod_strata_arc',
      name: 'Strata Arc 11.2.4 Cinema Bar',
      slug: 'strata-arc-cinema-bar',
      sku: 'SNQ-SA11-004',
      shortDescription: 'Brushed gunmetal Dolby Atmos & DTS:X spatial soundbar with 15 custom neodymium drivers.',
      description: 'Machined from brushed dark titanium aluminum, the Strata Arc projects ceiling-reflected height channels and wide psychoacoustic surround beams without cluttering your living space. Includes automated acoustic room mapping via dual built-in calibration microphones.',
      price: 1649,
      previousPrice: 1899,
      categoryId: 'cat_soundbars',
      brandId: 'brand_soniq',
      stock: 19,
      soldCount: 76,
      ratingAverage: 4.7,
      ratingCount: 1,
      images: ['/images/cinema-soundbar.jpg', '/images/reference-subwoofer.jpg'],
      specs: [
        { label: 'Channel Architecture', value: '11.2.4 Spatial Array (15 Drivers)' },
        { label: 'Output Power', value: '950W Dynamic Peak' },
        { label: 'Audio Formats', value: 'Dolby Atmos, DTS:X, IMAX Enhanced' },
        { label: 'HDMI', value: '2× HDMI 2.1 In, 1× HDMI eARC Out (8K/120Hz)' },
        { label: 'Width', value: '1220 mm' },
      ],
      isFeatured: 1,
      isBestSeller: 0,
      isNewArrival: 1,
    },
    {
      id: 'prod_sub_zero_d12',
      name: 'SubZero D12 Force-Canceling Cube',
      slug: 'subzero-d12-subwoofer',
      sku: 'SNQ-SZ12-005',
      shortDescription: 'Dual opposing 12-inch carbon sub-bass engine with 1400W RMS amplification and app EQ.',
      description: 'Designed to disappear acoustically while shaking the room down to 16Hz, the SubZero D12 opposes two high-excursion 12-inch drivers on a rigid carbon-reinforced chassis—eliminating cabinet vibration even at reference cinema levels.',
      price: 1349,
      previousPrice: null,
      categoryId: 'cat_subwoofers',
      brandId: 'brand_krono',
      stock: 8,
      soldCount: 54,
      ratingAverage: 4.9,
      ratingCount: 1,
      images: ['/images/reference-subwoofer.jpg', '/images/hero-flagship.jpg'],
      specs: [
        { label: 'Frequency Extension', value: '16 Hz – 200 Hz (-3 dB)' },
        { label: 'Amplifier', value: '1400W RMS / 2800W Peak Class-D' },
        { label: 'Drivers', value: 'Dual 12" Long-Throw Carbon Cones' },
        { label: 'DSP Control', value: '10-Band Parametric EQ & Phase Alignment' },
        { label: 'Dimensions', value: '390 × 390 × 410 mm · 28.4 kg' },
      ],
      isFeatured: 0,
      isBestSeller: 1,
      isNewArrival: 0,
    },
    {
      id: 'prod_pulse_360',
      name: 'SONIQ Pulse 360 Titanium Portable',
      slug: 'soniq-pulse-360-portable',
      sku: 'SNQ-P360-006',
      shortDescription: 'IP67 weather-sealed 360° wireless speaker with CNC knurled volume dial and 24-hour battery.',
      description: 'Take uncompromised acoustic fidelity anywhere. The Pulse 360 integrates an upward-firing neodymium transducer and dual passive radiators inside a weatherproof acoustic weave sleeve crowned by a weighted, precision-machined titanium control dial.',
      price: 449,
      previousPrice: 499,
      categoryId: 'cat_portable',
      brandId: 'brand_soniq',
      stock: 46,
      soldCount: 163,
      ratingAverage: 4.8,
      ratingCount: 1,
      images: ['/images/portable-cylinder.jpg', '/images/bookshelf-pair.jpg'],
      specs: [
        { label: 'Acoustic Dispersion', value: '360° Omnidirectional Waveguide' },
        { label: 'Battery Life', value: 'Up to 24 Hours (USB-C PD Fast Charge)' },
        { label: 'Protection', value: 'IP67 Dust & Water Resistant' },
        { label: 'Connectivity', value: 'Bluetooth 5.4, Wi-Fi Multi-Room, NFC' },
        { label: 'Weight', value: '1.65 kg' },
      ],
      isFeatured: 1,
      isBestSeller: 1,
      isNewArrival: 1,
    },
    {
      id: 'prod_krono_s4',
      name: 'Krono S4 Compact Nearfield Pair',
      slug: 'krono-s4-compact-nearfield',
      sku: 'SNQ-KS4-007',
      shortDescription: 'Precision desktop reference monitors with tilted acoustic isolation plinths.',
      description: 'Engineered specifically for close-proximity listening on executive desks and edit suites, the Krono S4 achieves pinpoint stereo imaging and crystalline vocal separation without requiring sub-bass reinforcement.',
      price: 799,
      previousPrice: 899,
      categoryId: 'cat_studio',
      brandId: 'brand_krono',
      stock: 4,
      soldCount: 41,
      ratingAverage: 4.7,
      ratingCount: 0,
      images: ['/images/bookshelf-pair.jpg', '/images/studio-monitor.jpg'],
      specs: [
        { label: 'Frequency Response', value: '45 Hz – 30 kHz' },
        { label: 'Power', value: '240W Class-AB/D Hybrid' },
        { label: 'Inputs', value: 'USB-C 32-bit DAC, TRS Balanced, Aux' },
        { label: 'Dimensions', value: '240 × 150 × 185 mm' },
      ],
      isFeatured: 0,
      isBestSeller: 0,
      isNewArrival: 1,
    },
    {
      id: 'prod_aether_tower_pro',
      name: 'Aether Pro T900 Studio Tower',
      slug: 'aether-pro-t900-tower',
      sku: 'SNQ-AT9-008',
      shortDescription: 'Midfield mastering tower system with linear-phase crossover and dual side-firing woofers.',
      description: 'Crafted for large acoustic spaces and commercial scoring stages, the T900 delivers effortless dynamic headroom and razor-flat phase linearity across the entire audible spectrum.',
      price: 3499,
      previousPrice: 3899,
      categoryId: 'cat_floorstanding',
      brandId: 'brand_aether',
      stock: 0,
      soldCount: 22,
      ratingAverage: 4.9,
      ratingCount: 0,
      images: ['/images/hero-flagship.jpg', '/images/reference-subwoofer.jpg'],
      specs: [
        { label: 'Frequency Response', value: '24 Hz – 38 kHz (±1.0 dB)' },
        { label: 'Power', value: '1500W Continuous' },
        { label: 'Inputs', value: 'Dante Network Audio, AES3, XLR' },
        { label: 'Weight', value: '41.0 kg per unit' },
      ],
      isFeatured: 0,
      isBestSeller: 0,
      isNewArrival: 0,
    },
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (
      id, name, slug, sku, description, shortDescription, price, previousPrice,
      categoryId, brandId, stock, soldCount, ratingAverage, ratingCount,
      imagesJson, specsJson, isFeatured, isBestSeller, isNewArrival, isPublished, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  for (const p of products) {
    insertProd.run(
      p.id,
      p.name,
      p.slug,
      p.sku,
      p.description,
      p.shortDescription,
      p.price,
      p.previousPrice,
      p.categoryId,
      p.brandId,
      p.stock,
      p.soldCount,
      p.ratingAverage,
      p.ratingCount,
      JSON.stringify(p.images),
      JSON.stringify(p.specs),
      p.isFeatured,
      p.isBestSeller,
      p.isNewArrival,
      now,
      now
    );
  }

  // Seed Promotional Banners
  const insertBanner = db.prepare(`
    INSERT INTO banners (id, title, subtitle, ctaText, ctaLink, imageUrl, imagePublicId, placement, displayOrder, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, 1, ?, ?)
  `);
  insertBanner.run(
    'ban_flagship_promo',
    'Monolith X1 Studio Architecture',
    'CNC-machined anodized aluminum housing with 1800W quad-channel amplification and automated room DSP.',
    'Configure Monolith X1',
    '/products/soniq-monolith-x1-reference',
    '/images/hero-flagship.jpg',
    'PROMO',
    1,
    now,
    now
  );
  insertBanner.run(
    'ban_cinema_promo',
    'Cinema Calibration Suite',
    'Pair Strata Arc 11.2.4 with SubZero D12 for reference Dolby Atmos immersion in any architectural room.',
    'Shop Home Cinema',
    '/shop?category=cinema-soundbars',
    '/images/cinema-soundbar.jpg',
    'PROMO',
    2,
    now,
    now
  );

  // Seed Coupons
  const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, usedCount, expiresAt, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  insertCoupon.run('coup_soniq10', 'SONIQ10', 'PERCENTAGE', 10, 300, 500, 500, 12, futureDate, now, now);
  insertCoupon.run('coup_studio150', 'STUDIO150', 'FIXED', 150, 1000, null, 200, 4, futureDate, now, now);

  // Seed Verified Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, productId, userId, authorName, rating, title, comment, status, isVerifiedPurchase, createdAt, updatedAt)
    VALUES (?, ?, NULL, ?, ?, ?, ?, 'APPROVED', 1, ?, ?)
  `);
  insertReview.run(
    'rev_1',
    'prod_monolith_x1',
    'Marcus Vance',
    5,
    'Holographic imaging without room coloration',
    'Replaced a pair of $9,000 passive towers with the Monolith X1. The waveguide dispersion locks the phantom center image regardless of seating position, and the 22Hz low end is startlingly tight.',
    now,
    now
  );
  insertReview.run(
    'rev_2',
    'prod_monolith_x1',
    'Elena Rostova',
    5,
    'Mastering-grade precision in an architectural sculpture',
    'Every transient arrives cleanly without harshness. The CNC chassis runs dead silent even after six-hour studio sessions.',
    now,
    now
  );
  insertReview.run(
    'rev_3',
    'prod_apex_m8',
    'Devon Mercer',
    5,
    'My mixes translate immediately everywhere',
    'The FIR phase calibration solved a stubborn 85Hz room null in my studio. Zero ear fatigue over full production days.',
    now,
    now
  );
  insertReview.run(
    'rev_4',
    'prod_aurelia_duo',
    'Claire Takahashi',
    5,
    'Cleanest wireless setup I have owned',
    'Zero cable clutter between the speakers, effortless HDMI eARC with our OLED display, and astonishing midrange detail on acoustic recordings.',
    now,
    now
  );
  insertReview.run(
    'rev_5',
    'prod_strata_arc',
    'Julian Sterling',
    5,
    'True architectural cinema presence',
    'Dialogue clarity is crystal sharp at low night volume, and height effects feel genuinely overhead.',
    now,
    now
  );
  insertReview.run(
    'rev_6',
    'prod_pulse_360',
    'Nadia Lindqvist',
    5,
    'Tactile titanium dial and remarkable battery endurance',
    'Carried the Pulse 360 across coastal terraces all weekend. Rich, balanced sound in every direction without boomy DSP distortion.',
    now,
    now
  );

  // Seed historical sample customer & orders so analytics & order management reflect real DB data
  const sampleCustId = 'cust_sample_01';
  const samplePassHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
  db.prepare(`
    INSERT INTO users (id, name, email, passwordHash, role, phone, isBlocked, addressesJson, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'CUSTOMER', ?, 0, ?, ?, ?)
  `).run(
    sampleCustId,
    'Marcus Vance',
    'marcus.vance@example.com',
    samplePassHash,
    '+1 415 555 0198',
    JSON.stringify([
      {
        id: 'addr_1',
        label: 'Studio Loft',
        fullName: 'Marcus Vance',
        phone: '+1 415 555 0198',
        country: 'United States',
        city: 'San Francisco',
        address: '450 Townsend St, Suite 302',
        postalCode: '94107',
        isDefault: true,
      },
    ]),
    now,
    now
  );

  const monthsAgo = (m: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    return d.toISOString();
  };

  const sampleOrders = [
    {
      id: 'ord_seed_01',
      orderNumber: 'SNQ-2026-1041',
      userId: sampleCustId,
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.vance@example.com',
      customerPhone: '+1 415 555 0198',
      shippingCountry: 'United States',
      shippingCity: 'San Francisco',
      shippingAddress: '450 Townsend St, Suite 302',
      postalCode: '94107',
      items: [{ productId: 'prod_monolith_x1', name: 'SONIQ Monolith X1 Reference', sku: 'SNQ-MX1-001', price: 4299, quantity: 1, imageUrl: '/images/hero-flagship.jpg' }],
      subtotal: 4299,
      discountAmount: 0,
      couponCode: '',
      shippingFee: 0,
      totalAmount: 4299,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      orderStatus: 'Delivered',
      trackingNumber: 'FDX-994821044',
      createdAt: monthsAgo(4),
    },
    {
      id: 'ord_seed_02',
      orderNumber: 'SNQ-2026-1042',
      userId: sampleCustId,
      customerName: 'Elena Rostova',
      customerEmail: 'elena.r@example.com',
      customerPhone: '+1 212 555 0144',
      shippingCountry: 'United States',
      shippingCity: 'New York',
      shippingAddress: '88 Crosby St, Floor 4',
      postalCode: '10012',
      items: [{ productId: 'prod_apex_m8', name: 'Apex M8 Carbon Studio Monitor', sku: 'SNQ-AM8-002', price: 1499, quantity: 2, imageUrl: '/images/studio-monitor.jpg' }],
      subtotal: 2998,
      discountAmount: 299.8,
      couponCode: 'SONIQ10',
      shippingFee: 0,
      totalAmount: 2698.2,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      orderStatus: 'Delivered',
      trackingNumber: 'UPS-77219033',
      createdAt: monthsAgo(3),
    },
    {
      id: 'ord_seed_03',
      orderNumber: 'SNQ-2026-1043',
      userId: null,
      customerName: 'Claire Takahashi',
      customerEmail: 'claire.t@example.com',
      customerPhone: '+1 310 555 0182',
      shippingCountry: 'United States',
      shippingCity: 'Los Angeles',
      shippingAddress: '1120 Abbot Kinney Blvd',
      postalCode: '90291',
      items: [
        { productId: 'prod_strata_arc', name: 'Strata Arc 11.2.4 Cinema Bar', sku: 'SNQ-SA11-004', price: 1649, quantity: 1, imageUrl: '/images/cinema-soundbar.jpg' },
        { productId: 'prod_sub_zero_d12', name: 'SubZero D12 Force-Canceling Cube', sku: 'SNQ-SZ12-005', price: 1349, quantity: 1, imageUrl: '/images/reference-subwoofer.jpg' },
      ],
      subtotal: 2998,
      discountAmount: 150,
      couponCode: 'STUDIO150',
      shippingFee: 0,
      totalAmount: 2848,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      orderStatus: 'Shipped',
      trackingNumber: 'DHL-55201948',
      createdAt: monthsAgo(2),
    },
    {
      id: 'ord_seed_04',
      orderNumber: 'SNQ-2026-1044',
      userId: null,
      customerName: 'Julian Sterling',
      customerEmail: 'j.sterling@example.com',
      customerPhone: '+44 20 7946 0921',
      shippingCountry: 'United Kingdom',
      shippingCity: 'London',
      shippingAddress: '14 Redchurch St, Shoreditch',
      postalCode: 'E2 7DP',
      items: [{ productId: 'prod_aurelia_duo', name: 'Aurelia Duo Wireless Bookshelf', sku: 'SNQ-AD2-003', price: 1199, quantity: 1, imageUrl: '/images/bookshelf-pair.jpg' }],
      subtotal: 1199,
      discountAmount: 0,
      couponCode: '',
      shippingFee: 0,
      totalAmount: 1199,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'Processing',
      trackingNumber: '',
      createdAt: monthsAgo(1),
    },
    {
      id: 'ord_seed_05',
      orderNumber: 'SNQ-2026-1045',
      userId: sampleCustId,
      customerName: 'Nadia Lindqvist',
      customerEmail: 'nadia.l@example.com',
      customerPhone: '+46 8 501 240 10',
      shippingCountry: 'Sweden',
      shippingCity: 'Stockholm',
      shippingAddress: 'Sibyllegatan 28',
      postalCode: '114 43',
      items: [{ productId: 'prod_pulse_360', name: 'SONIQ Pulse 360 Titanium Portable', sku: 'SNQ-P360-006', price: 449, quantity: 2, imageUrl: '/images/portable-cylinder.jpg' }],
      subtotal: 898,
      discountAmount: 0,
      couponCode: '',
      shippingFee: 0,
      totalAmount: 898,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      orderStatus: 'Pending',
      trackingNumber: '',
      createdAt: now,
    },
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, orderNumber, userId, customerName, customerEmail, customerPhone,
      shippingCountry, shippingCity, shippingAddress, postalCode, itemsJson,
      subtotal, discountAmount, couponCode, shippingFee, totalAmount,
      paymentMethod, paymentStatus, orderStatus, trackingNumber, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)
  `);
  for (const o of sampleOrders) {
    insertOrder.run(
      o.id,
      o.orderNumber,
      o.userId,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.shippingCountry,
      o.shippingCity,
      o.shippingAddress,
      o.postalCode,
      JSON.stringify(o.items),
      o.subtotal,
      o.discountAmount,
      o.couponCode,
      o.shippingFee,
      o.totalAmount,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.trackingNumber,
      o.createdAt,
      o.createdAt
    );
  }
}
