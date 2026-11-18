const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    ctaText: { type: String, default: 'Explore Collection' },
    ctaLink: { type: String, default: '/shop' },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, default: '' },
    },
    placement: { type: String, default: 'PROMO' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
