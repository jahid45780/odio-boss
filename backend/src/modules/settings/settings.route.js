const express = require('express');
const WebsiteSettings = require('./settings.model');
const {
  ThemeSettings,
  PageContent,
  HomepageSection,
  NavigationSettings,
  FooterSettings,
  SEOSettings,
} = require('./cms.models');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');

const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/;

function validatePalette(palette) {
  if (!palette) return;
  for (const [k, v] of Object.entries(palette)) {
    if (typeof v !== 'string' || !CSS_COLOR_RE.test(v.trim())) {
      throw new ApiError(400, `Invalid CSS color value for ${k}`);
    }
  }
}

const router = express.Router();

router.get(
  '/',
  catchAsync(async (_req, res) => {
    let settings = await WebsiteSettings.findOne({ key: 'default' }).lean();
    if (!settings) settings = (await WebsiteSettings.create({ key: 'default' })).toObject();
    const theme = await ThemeSettings.findOne({ key: 'default' }).lean();
    const navigation = await NavigationSettings.findOne({ key: 'default' }).lean();
    const footer = await FooterSettings.findOne({ key: 'default' }).lean();
    const homepage = await HomepageSection.findOne({ key: 'default' }).lean();

    sendResponse(res, 200, {
      settings: {
        ...settings,
        themeConfig: theme?.publishedConfig || null,
        themeDraftConfig: theme?.draftConfig || null,
        navigationConfig: navigation || null,
        footerConfig: footer || null,
        homepageConfig: homepage || null,
      },
    });
  })
);

router.patch(
  '/',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const { navigationConfig, footerConfig, homepageConfig, themeConfig, ...coreFields } = req.body;
    const settings = await WebsiteSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: coreFields },
      { new: true, upsert: true }
    );
    if (navigationConfig) {
      await NavigationSettings.findOneAndUpdate({ key: 'default' }, { $set: navigationConfig }, { upsert: true });
    }
    if (footerConfig) {
      await FooterSettings.findOneAndUpdate({ key: 'default' }, { $set: footerConfig }, { upsert: true });
    }
    if (homepageConfig) {
      await HomepageSection.findOneAndUpdate({ key: 'default' }, { $set: homepageConfig }, { upsert: true });
    }
    if (themeConfig) {
      validatePalette(themeConfig.darkPalette);
      validatePalette(themeConfig.lightPalette);
      await ThemeSettings.findOneAndUpdate(
        { key: 'default' },
        { $set: { publishedConfig: themeConfig } },
        { upsert: true }
      );
    }
    sendResponse(res, 200, { settings });
  })
);

router.patch(
  '/theme',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const { action, themeConfig } = req.body;
    if (action === 'reset') {
      const resetDoc = await ThemeSettings.findOneAndUpdate(
        { key: 'default' },
        { $unset: { draftConfig: 1 }, $set: { publishedConfig: null } },
        { new: true, upsert: true }
      );
      return sendResponse(res, 200, { theme: resetDoc });
    }
    if (themeConfig) {
      validatePalette(themeConfig.darkPalette);
      validatePalette(themeConfig.lightPalette);
    }
    const update =
      action === 'save_draft'
        ? { $set: { draftConfig: themeConfig } }
        : { $set: { publishedConfig: themeConfig, draftConfig: null } };
    const doc = await ThemeSettings.findOneAndUpdate({ key: 'default' }, update, { new: true, upsert: true });
    sendResponse(res, 200, { theme: doc });
  })
);

router.get(
  '/pages',
  catchAsync(async (req, res) => {
    if (req.query.slug) {
      const page = await PageContent.findOne({ slug: req.query.slug });
      if (!page) throw new ApiError(404, 'Page content not found');
      return sendResponse(res, 200, { page });
    }
    const pages = await PageContent.find().sort({ slug: 1 });
    sendResponse(res, 200, { pages });
  })
);

router.put(
  '/pages',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const { slug, ...rest } = req.body;
    if (!slug) throw new ApiError(400, 'Page slug is required');
    const page = await PageContent.findOneAndUpdate({ slug }, { $set: rest }, { new: true, upsert: true });
    sendResponse(res, 200, { page });
  })
);

router.get(
  '/seo',
  catchAsync(async (req, res) => {
    if (req.query.pageKey) {
      const seo = await SEOSettings.findOne({ pageKey: req.query.pageKey });
      if (!seo) throw new ApiError(404, 'SEO setting not found');
      return sendResponse(res, 200, { seo });
    }
    const seoSettings = await SEOSettings.find().sort({ pageKey: 1 });
    sendResponse(res, 200, { seoSettings });
  })
);

router.put(
  '/seo',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const { pageKey, ...rest } = req.body;
    if (!pageKey) throw new ApiError(400, 'pageKey is required');
    const seo = await SEOSettings.findOneAndUpdate({ pageKey }, { $set: rest }, { new: true, upsert: true });
    sendResponse(res, 200, { seo });
  })
);

module.exports = router;
