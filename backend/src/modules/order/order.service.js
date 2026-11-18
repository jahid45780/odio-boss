const mongoose = require('mongoose');
const Order = require('./order.model');
const Product = require('../product/product.model');
const Coupon = require('../coupon/coupon.model');
const WebsiteSettings = require('../settings/settings.model');
const InventoryLog = require('../inventory/inventory.model');
const ApiError = require('../../utils/ApiError');

async function createOrder(payload, user = null) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const settings = (await WebsiteSettings.findOne({ key: 'default' }).session(session)) || {
      shippingCharge: 35,
      freeShippingThreshold: 500,
    };

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of payload.items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product || !product.isPublished) {
        throw new ApiError(400, 'One or more products are unavailable.');
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}.`);
      }

      const prevStock = product.stock;
      product.stock -= item.quantity;
      product.soldCount += item.quantity;
      await product.save({ session });

      await InventoryLog.create(
        [
          {
            product: product._id,
            productName: product.name,
            sku: product.sku,
            previousStock: prevStock,
            changeAmount: -item.quantity,
            newStock: product.stock,
            reason: 'Customer order placement',
            actorName: payload.customerName,
          },
        ],
        { session }
      );

      subtotal += product.price * item.quantity;
      resolvedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.images[0]?.url || '',
      });
    }

    let discountAmount = 0;
    let appliedCoupon = '';
    if (payload.couponCode) {
      const coupon = await Coupon.findOne({ code: payload.couponCode.toUpperCase(), isActive: true }).session(session);
      if (!coupon || coupon.expiresAt < new Date()) throw new ApiError(400, 'Coupon is invalid or expired.');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon limit reached.');
      if (subtotal < coupon.minOrderAmount) throw new ApiError(400, 'Order does not meet coupon minimum.');

      discountAmount =
        coupon.discountType === 'PERCENTAGE'
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue;
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      discountAmount = Math.min(subtotal, Number(discountAmount.toFixed(2)));
      appliedCoupon = coupon.code;

      coupon.usedCount += 1;
      await coupon.save({ session });
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const shippingFee = afterDiscount >= settings.freeShippingThreshold ? 0 : settings.shippingCharge;
    const totalAmount = Number((afterDiscount + shippingFee).toFixed(2));

    const [order] = await Order.create(
      [
        {
          orderNumber: `SNQ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          user: user?._id || null,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          shippingAddress: {
            country: payload.shippingCountry,
            city: payload.shippingCity,
            address: payload.shippingAddress,
            postalCode: payload.postalCode,
          },
          items: resolvedItems,
          subtotal,
          discountAmount,
          couponCode: appliedCoupon,
          shippingFee,
          totalAmount,
          paymentMethod: payload.paymentMethod || 'COD',
          notes: payload.notes || '',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { createOrder };
