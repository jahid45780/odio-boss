const mongoose = require('mongoose');

const paletteSchema = new mongoose.Schema(
  {
    background: String,
    secondaryBackground: String,
    cardBackground: String,
    elevatedBackground: String,
    textPrimary: String,
    textSecondary: String,
    accentPrimary: String,
    accentSecondary: String,
    buttonBg: String,
    buttonText: String,
    border: String,
  },
  { _id: false }
);

const themeConfigSubSchema = new mongoose.Schema(
  {
    defaultTheme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    enableDarkTheme: { type: Boolean, default: true },
    enableLightTheme: { type: Boolean, default: true },
    darkPalette: paletteSchema,
    lightPalette: paletteSchema,
    typography: {
      displayFont: { type: String, default: 'outfit' },
      bodyFont: { type: String, default: 'manrope' },
      baseSizeScale: { type: String, default: 'standard' },
    },
    layout: {
      borderRadius: { type: String, default: 'rounded' },
      sectionSpacing: { type: String, default: 'balanced' },
    },
  },
  { _id: false }
);

const themeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    publishedConfig: themeConfigSubSchema,
    draftConfig: { type: themeConfigSubSchema, default: null },
  },
  { timestamps: true }
);

const pageContentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    eyebrow: { type: String, default: '' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    heroImageUrl: { type: String, default: '' },
    sections: [{ heading: String, body: String }],
    faqItems: [{ question: String, answer: String }],
  },
  { timestamps: true }
);

const homepageSectionSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    heroBackgroundImageUrl: { type: String, default: '' },
    heroPrimaryCtaText: { type: String, default: 'Explore Collection' },
    heroPrimaryCtaUrl: { type: String, default: '/shop' },
    heroSecondaryCtaText: { type: String, default: 'Discover Our Technology' },
    heroSecondaryCtaUrl: { type: String, default: '#technology' },
    featuredProductIds: [String],
    bestSellerProductIds: [String],
    newArrivalProductIds: [String],
    sections: [
      {
        key: String,
        eyebrow: String,
        title: String,
        description: String,
        isVisible: Boolean,
        sortOrder: Number,
      },
    ],
  },
  { timestamps: true }
);

const navigationSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    headerStyle: { type: String, enum: ['blur', 'solid', 'transparent'], default: 'blur' },
    stickyHeader: { type: Boolean, default: true },
    links: [{ id: String, label: String, href: String, isVisible: Boolean, sortOrder: Number }],
  },
  { timestamps: true }
);

const footerSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    copyrightText: { type: String, default: '© {year} {siteName}. All rights reserved.' },
    newsletterEyebrow: { type: String, default: 'Acoustic Dispatches' },
    newsletterTitle: { type: String, default: 'Receive limited-edition speaker releases and calibration notes.' },
    newsletterSubtitle: { type: String, default: '' },
    newsletterButtonText: { type: String, default: 'Subscribe' },
    columns: [{ id: String, title: String, links: [{ label: String, href: String }] }],
  },
  { timestamps: true }
);

const seoSettingsSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    keywords: { type: String, default: '' },
    ogImageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const mediaAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    label: { type: String, required: true },
    category: { type: String, enum: ['logo', 'banner', 'background', 'product', 'general'], default: 'general' },
    provider: { type: String, enum: ['cloudinary', 'local', 'builtin'], default: 'cloudinary' },
  },
  { timestamps: true }
);

module.exports = {
  ThemeSettings: mongoose.model('ThemeSettings', themeSettingsSchema),
  PageContent: mongoose.model('PageContent', pageContentSchema),
  HomepageSection: mongoose.model('HomepageSection', homepageSectionSchema),
  NavigationSettings: mongoose.model('NavigationSettings', navigationSettingsSchema),
  FooterSettings: mongoose.model('FooterSettings', footerSettingsSchema),
  SEOSettings: mongoose.model('SEOSettings', seoSettingsSchema),
  MediaAsset: mongoose.model('MediaAsset', mediaAssetSchema),
};
