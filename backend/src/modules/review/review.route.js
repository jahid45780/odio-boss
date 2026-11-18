const express = require('express');
const Review = require('./review.model');
const Product = require('../product/product.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate, optionalAuth } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');

const router = express.Router();

router.get(
  '/',
  catchAsync(async (req, res) => {
    const filter = req.query.all === 'true' ? {} : { status: 'APPROVED' };
    if (req.query.productId) filter.product = req.query.productId;
    const reviews = await Review.find(filter).populate('product', 'name').sort({ createdAt: -1 });
    sendResponse(res, 200, { reviews });
  })
);

router.post(
  '/',
  optionalAuth,
  catchAsync(async (req, res) => {
    const review = await Review.create({
      product: req.body.productId,
      user: req.user?._id || null,
      authorName: req.user?.name || req.body.authorName,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
    });
    sendResponse(res, 201, { review });
  })
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (review) {
      const stats = await Review.aggregate([
        { $match: { product: review.product, status: 'APPROVED' } },
        { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      await Product.findByIdAndUpdate(review.product, {
        ratingAverage: stats[0] ? Number(stats[0].avg.toFixed(1)) : 0,
        ratingCount: stats[0] ? stats[0].count : 0,
      });
    }
    sendResponse(res, 200, { review });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, { deleted: true });
  })
);

module.exports = router;
