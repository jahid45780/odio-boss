# SONIQ Express + MongoDB Backend

Standalone modular MVC REST API for the SONIQ audio speaker e-commerce platform.

## Setup

```bash
cd backend
cp .env.example .env
npm install
```

Configure `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`, then seed the administrator account:

```bash
npm run seed:admin
npm run dev
```

The API mounts under `/api/v1/` on port `5000` by default.
