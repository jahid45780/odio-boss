const express = require('express');
const Coupon = require('./coupon.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

router.get(
  '/',
  authenticate,
  requireAdmin,
  catchAsync(async (_req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    sendResponse(res, 200, { coupons });
  })
);

router.post(
  '/validate',
  catchAsync(async (req, res) => {
    const code = String(req.body.code || '').toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon || coupon.expiresAt < new Date()) throw new ApiError(404, 'Coupon is invalid or expired.');
    if (subtotal < coupon.minOrderAmount) throw new ApiError(400, 'Minimum order amount not reached.');

    let discountAmount =
      coupon.discountType === 'PERCENTAGE'
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    discountAmount = Math.min(subtotal, Number(discountAmount.toFixed(2)));
    sendResponse(res, 200, { code: coupon.code, discountAmount });
  })
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const coupon = await Coupon.create(req.body);
    sendResponse(res, 201, { coupon });
  })
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendResponse(res, 200, { coupon });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, { deleted: true });
  })
);

module.exports = router;
