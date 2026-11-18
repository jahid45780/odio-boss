const express = require('express');
const Product = require('../product/product.model');
const InventoryLog = require('./inventory.model');
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
    const [products, logs] = await Promise.all([
      Product.find().sort({ stock: 1 }),
      InventoryLog.find().sort({ createdAt: -1 }).limit(100),
    ]);
    sendResponse(res, 200, {
      products,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10),
      outOfStock: products.filter((p) => p.stock === 0),
      logs,
    });
  })
);

router.patch(
  '/:productId',
  authenticate,
  requireAdmin,
  catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const prevStock = product.stock;
    const nextStock = Math.max(0, Number(req.body.stock));
    product.stock = nextStock;
    await product.save();

    await InventoryLog.create({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      previousStock: prevStock,
      changeAmount: nextStock - prevStock,
      newStock: nextStock,
      reason: req.body.reason || 'Manual adjustment',
      actorName: req.user.name,
    });

    sendResponse(res, 200, { product });
  })
);

module.exports = router;
