# SONIQ — Luxury Audio Speaker E-Commerce Platform

SONIQ is a full-stack audio hardware e-commerce platform featuring a luxury dark storefront, server-verified cart and checkout, customer account portal, protected 11-module admin dashboard, and dual backend support:

1. **Integrated Full-Stack Next.js App (`/app`, `/app/api/v1`)**: Runs directly on port `3000` with built-in SQLite (`node:sqlite`) persistence, JWT HTTP-only cookie auth (`jose` + `bcryptjs`), Zod validation, atomic order & inventory transactions, and Cloudinary/local upload support.
2. **Standalone Express + MongoDB MVC Backend (`/backend`)**: Independent Express 4 + Mongoose + Multer + Cloudinary + Helmet + Rate-Limit backend on port `5000`. Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` in the frontend environment to route API requests to the standalone Express server.

## Implemented Features

- **Customer Storefront**: Dynamic homepage driven by database settings/banners/catalog, interactive Shop with multi-facet search/category/brand/price/rating/stock filters & sorting, Product Details with gallery, technical specs, verified reviews, related items, and Schema.org JSON-LD.
- **Cart & Checkout**: Persistent Zustand bag & wishlist, slide-over Cart Drawer, server-validated coupon codes (`SONIQ10`, `STUDIO150`), dynamic shipping thresholds, atomic stock deduction, and Order Confirmation receipts.
- **Customer Authentication & Portal**: Register, Sign In, Sign Out, Forgot/Reset Password, Profile, Order History, Saved Wishlist, Delivery Address book, and Password Change.
- **Protected Admin Dashboard (`/admin/login` & `/admin/dashboard`)**:
  - Real database KPIs & Monthly Revenue Chart (`Overview`)
  - Products CRUD with multi-image upload & technical specifications editor
  - Categories & Brands management
  - Orders management (status, payment status, tracking numbers, cancellation stock restoration)
  - Customer directory, order history inspection, and account block/unblock
  - Inventory levels & stock movement audit log
  - Coupons, Promotional Banners, Review Moderation, and Live Website Settings (hero copy/image, announcement bar, shipping rules, section toggles)

## Environment Variables

Copy `.env.example` to `.env` (for the Next.js app) and `backend/.env.example` to `backend/.env` (when running the standalone Express/MongoDB server). Never commit real secrets.

## Admin Creation

### Option A — CLI Seeding (Next.js SQLite or Standalone MongoDB)
Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in your environment, then run:

```bash
npm run seed:admin
```

Or for the standalone MongoDB backend:

```bash
cd backend && npm run seed:admin
```

### Option B — First-Run UI Initialization
Navigate to `/admin/login`. If no administrator account exists in the database yet, a one-time initialization form allows creating the primary admin account securely.

## Development Commands

```bash
# Integrated Next.js App (Port 3000)
npm install
npm run dev
npm run build
npm run lint

# Standalone Express + MongoDB Backend (Port 5000)
cd backend
npm install
npm run dev
```
