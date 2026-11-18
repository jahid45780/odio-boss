const express = require('express');
const User = require('./user.model');
const Order = require('../order/order.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');

const router = express.Router();

router.get(
  '/',
  authenticate,
  requireAdmin,
  catchAsync(async (_req, res) => {
    const customers = await User.find({ role: 'CUSTOMER' }).select('-passwordHash').sort({ createdAt: -1 });
    sendResponse(res, 200, { customers });
  })
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const customer = await User.findById(req.params.id).select('-passwordHash');
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    sendResponse(res, 200, { customer, orders });
  })
);

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: Boolean(req.body.isBlocked) },
      { new: true }
    ).select('-passwordHash');
    sendResponse(res, 200, { customer });
  })
);

module.exports = router;
