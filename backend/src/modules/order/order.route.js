const express = require('express');
const Order = require('./order.model');
const orderService = require('./order.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate, optionalAuth } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');

const router = express.Router();

router.post(
  '/',
  optionalAuth,
  catchAsync(async (req, res) => {
    const order = await orderService.createOrder(req.body, req.user);
    sendResponse(res, 201, { order }, 'Order confirmed');
  })
);

router.get(
  '/my-orders',
  authenticate,
  catchAsync(async (req, res) => {
    const orders = await Order.find({ $or: [{ user: req.user._id }, { customerEmail: req.user.email }] }).sort({
      createdAt: -1,
    });
    sendResponse(res, 200, { orders });
  })
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.status && req.query.status !== 'ALL') filter.orderStatus = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    sendResponse(res, 200, { orders });
  })
);

router.get(
  '/:id',
  optionalAuth,
  catchAsync(async (req, res) => {
    const isObj = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const order = await Order.findOne(isObj ? { _id: req.params.id } : { orderNumber: req.params.id });
    sendResponse(res, 200, { order });
  })
);

router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        ...(req.body.orderStatus ? { orderStatus: req.body.orderStatus } : {}),
        ...(req.body.paymentStatus ? { paymentStatus: req.body.paymentStatus } : {}),
        ...(req.body.trackingNumber !== undefined ? { trackingNumber: req.body.trackingNumber } : {}),
      },
      { new: true }
    );
    sendResponse(res, 200, { order }, 'Order status updated');
  })
);

module.exports = router;
