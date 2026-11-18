const express = require('express');
const Order = require('../order/order.model');
const Product = require('../product/product.model');
const User = require('../user/user.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');

const router = express.Router();

router.get(
  '/overview',
  authenticate,
  requireAdmin,
  catchAsync(async (_req, res) => {
    const [revAgg, totalProducts, totalCustomers, pendingOrders, completedOrders, lowStockProducts, recentOrders, bestSellingProducts] =
      await Promise.all([
        Order.aggregate([
          { $match: { orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } },
        ]),
        Product.countDocuments(),
        User.countDocuments({ role: 'CUSTOMER' }),
        Order.countDocuments({ orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] } }),
        Order.countDocuments({ orderStatus: 'Delivered' }),
        Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(8),
        Order.find().sort({ createdAt: -1 }).limit(6),
        Product.find().sort({ soldCount: -1 }).limit(5),
      ]);

    const monthlySeries = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    sendResponse(res, 200, {
      kpis: {
        totalRevenue: revAgg[0]?.totalRevenue || 0,
        totalOrders: revAgg[0]?.totalOrders || 0,
        totalProducts,
        totalCustomers,
        pendingOrders,
        completedOrders,
        lowStockCount: lowStockProducts.length,
      },
      monthlySeries: monthlySeries.map((m) => ({ month: m._id, revenue: m.revenue, orders: m.orders })),
      recentOrders,
      lowStockProducts,
      bestSellingProducts,
    });
  })
);

router.get(
  '/revenue',
  authenticate,
  requireAdmin,
  catchAsync(async (_req, res) => {
    const revenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    sendResponse(res, 200, { revenue });
  })
);

router.get(
  '/best-selling',
  authenticate,
  requireAdmin,
  catchAsync(async (_req, res) => {
    const products = await Product.find().sort({ soldCount: -1 }).limit(10);
    sendResponse(res, 200, { products });
  })
);

module.exports = router;
