# Ecommerce Monorepo

A full-stack ecommerce project with three parts:

- Backend API built with Node.js, Express, MongoDB, Firebase token verification, Cloudinary image uploads, and Razorpay payments
- Customer storefront built with React + Vite
- Admin dashboard built with React + Vite

## Project Layout

- `backend/` - API server, controllers, routes, middleware, and database/config code
- `frontend/` - customer-facing store
- `admin/` - admin panel for catalog, orders, users, and stats
- `dev.bat` - Windows helper to start the backend and storefront in separate terminals

## Main Features

- User registration, login, logout, profile, password reset, and Google sign-in
- Product browsing, category pages, cart, checkout, and order tracking
- Admin product management, order management, and user management
- MongoDB persistence
- Cloudinary image upload support
- Firebase ID token verification support
- Razorpay order/payment flow support

## Prerequisites

- Node.js 18+ recommended
- MongoDB connection string
- Firebase project credentials if you use Google sign-in
- Cloudinary account credentials if you upload product images
- Razorpay keys if you use online payments

## Environment Variables

### Backend

Create `backend/.env` with the values your deployment needs. The code reads these variables:

- `PORT`
- `MONGODB_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `NODE_ENV`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_DEBUG`
- `EMAIL_FROM`
- `RESET_EMAIL_SUBJECT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_ACCEPTED_AUDIENCES`

If you use Firebase Admin credentials, place the JSON file at `backend/firebase-service-account.json` or set `FIREBASE_SERVICE_ACCOUNT_PATH`.

### Frontend and Admin

Both client apps use `VITE_SERVER_URL` when you want to point them at a backend URL explicitly. If it is not set, they default to same-origin API requests and rely on the Vite proxy during development.

## Local Setup

Install dependencies in each app folder you plan to run:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

On Windows, the fastest way to start the storefront and backend together is:

```bat
dev.bat
```

Or start them manually from separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

```bash
cd admin
npm run dev
```

## Development Ports

- Backend API: `http://localhost:8000`
- Storefront: `http://localhost:5173`
- Admin dashboard: `http://localhost:5174`

The storefront proxies `/api` requests to the backend in development. The admin app also proxies `/api` requests to the backend.

## Available Scripts

### Root

- `npm run dev` - starts the backend and frontend together using `concurrently` and `wait-on`

### Backend

- `npm run dev` - runs the API with nodemon
- `npm start` - runs the API with node

### Frontend

- `npm run dev` - starts the customer app
- `npm run build` - builds the app for production
- `npm run lint` - runs ESLint
- `npm run preview` - previews the production build

### Admin

- `npm run dev` - starts the admin app
- `npm run build` - builds the app for production
- `npm run lint` - runs ESLint
- `npm run preview` - previews the production build

## Backend Routes

- `/api/auth` - authentication and account flows
- `/api/user` - user profile and user data
- `/api/admin` - admin-only operations
- `/api/cart` - cart handling
- `/api/order` - order creation and verification
- `/api/product` - product listing and product details
- `/api/health` - simple health check

## Notes

- Do not commit `backend/firebase-service-account.json`.
- Keep each app's `node_modules/` folder out of git.
- If you deploy the frontend or admin app separately, set `VITE_SERVER_URL` to your API base URL.
