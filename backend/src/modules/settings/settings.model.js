const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    siteName: { type: String, default: 'SONIQ' },
    tagline: { type: String, default: 'Precision Acoustic Engineering' },
    logo: { url: String, publicId: String },
    favicon: { url: String, publicId: String },
    contactEmail: { type: String, default: 'concierge@soniq-audio.com' },
    contactPhone: { type: String, default: '+1 (415) 890-4420' },
    address: { type: String, default: '740 Harrison Acoustic Way, San Francisco, CA 94107' },
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    shippingCharge: { type: Number, default: 35 },
    freeShippingThreshold: { type: Number, default: 500 },
    announcementText: { type: String, default: 'Complimentary insured delivery on orders over $500.' },
    announcementActive: { type: Boolean, default: true },
    heroTitle: { type: String, default: 'Experience Sound Beyond Limits.' },
    heroSubtitle: { type: String, default: 'Discover powerful audio technology designed to transform every moment into an unforgettable experience.' },
    heroImageUrl: { type: String, default: '' },
    footerAbout: { type: String, default: 'Engineered in San Francisco and Munich, SONIQ crafts reference loudspeaker systems.' },
    socialLinks: { type: Map, of: String, default: {} },
    homepageSections: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
