const express = require('express');
const Category = require('./category.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

const router = express.Router();

router.get(
  '/',
  catchAsync(async (req, res) => {
    const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
    sendResponse(res, 200, { categories });
  })
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  catchAsync(async (req, res) => {
    const image = req.file ? await uploadBufferToCloudinary(req.file.buffer, 'soniq/categories') : undefined;
    const slug = (req.body.slug || req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await Category.create({ ...req.body, slug, ...(image ? { image } : {}) });
    sendResponse(res, 201, { category });
  })
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  upload.single('image'),
  catchAsync(async (req, res) => {
    const image = req.file ? await uploadBufferToCloudinary(req.file.buffer, 'soniq/categories') : undefined;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...(image ? { image } : {}) },
      { new: true }
    );
    sendResponse(res, 200, { category });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, { deleted: true });
  })
);

module.exports = router;
