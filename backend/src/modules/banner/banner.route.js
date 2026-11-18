const express = require('express');
const Banner = require('./banner.model');
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
    const banners = await Banner.find(filter).sort({ displayOrder: 1 });
    sendResponse(res, 200, { banners });
  })
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  catchAsync(async (req, res) => {
    const image = req.file ? await uploadBufferToCloudinary(req.file.buffer, 'soniq/banners') : { url: req.body.imageUrl };
    const banner = await Banner.create({ ...req.body, image });
    sendResponse(res, 201, { banner });
  })
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendResponse(res, 200, { banner });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    await Banner.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, { deleted: true });
  })
);

module.exports = router;
