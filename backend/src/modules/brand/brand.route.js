const express = require('express');
const Brand = require('./brand.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

const router = express.Router();

router.get(
  '/',
  catchAsync(async (_req, res) => {
    const brands = await Brand.find().sort({ name: 1 });
    sendResponse(res, 200, { brands });
  })
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('logo'),
  catchAsync(async (req, res) => {
    const logo = req.file ? await uploadBufferToCloudinary(req.file.buffer, 'soniq/brands') : undefined;
    const slug = (req.body.slug || req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const brand = await Brand.create({ ...req.body, slug, ...(logo ? { logo } : {}) });
    sendResponse(res, 201, { brand });
  })
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendResponse(res, 200, { brand });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    await Brand.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, { deleted: true });
  })
);

module.exports = router;
