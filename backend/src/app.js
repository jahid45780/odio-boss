const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler } = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');

const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/user/user.route');
const productRoutes = require('./modules/product/product.route');
const categoryRoutes = require('./modules/category/category.route');
const brandRoutes = require('./modules/brand/brand.route');
const orderRoutes = require('./modules/order/order.route');
const couponRoutes = require('./modules/coupon/coupon.route');
const reviewRoutes = require('./modules/review/review.route');
const bannerRoutes = require('./modules/banner/banner.route');
const inventoryRoutes = require('./modules/inventory/inventory.route');
const analyticsRoutes = require('./modules/analytics/analytics.route');
const settingsRoutes = require('./modules/settings/settings.route');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser(config.cookieSecret));

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, status: 'healthy', service: 'soniq-express-api' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'API endpoint not found.'));
});

app.use(errorHandler);

module.exports = app;
