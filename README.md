# Luna Mart E-Commerce Web Application

Luna Mart is a complete full-stack e-commerce project built with Next.js, React, TypeScript, API routes, and MongoDB integration. It includes product catalog browsing, cart and checkout, user login, admin/user role-based access, product management, and order tracking.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript
- Backend: Next.js API routes
- Database: MongoDB Atlas or local MongoDB through `MONGODB_URI`
- Styling: custom CSS with light pink, light violet, white theme, and soft animated background
- Deployment: Vercel-ready

## Features

- Product catalog with search, categories, stock labels, ratings, and tags
- Add to cart, quantity controls, free-shipping guidance, and checkout
- User registration and login
- Role-based access for Admin and User
- Admin product creation, stock updates, product deletion
- Admin order status management
- Customer order tracking with automatic refresh and live progress steps
- MongoDB integration with demo in-memory fallback for quick local testing

## Demo Accounts

- Admin: `admin@lunamart.com` / `Admin@123`
- User: `user@lunamart.com` / `User@123`

## Run In VS Code

1. Open this folder in VS Code:
   `C:\Users\santhosh\OneDrive\Desktop\intern\fullstack\3rd website`

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open:
   `http://localhost:3000`

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`, use Command Prompt in VS Code or run:

```bash
cmd.exe /c npm install
cmd.exe /c npm run dev
```

The app works immediately with demo in-memory data. For real persistent database storage, add a `.env` file.

Production build check:

```bash
cmd.exe /c npm run build
```

## MongoDB Setup

Create `.env` from `.env.example`:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/luna_mart
MONGODB_DB=luna_mart
AUTH_SECRET=replace-this-with-a-long-random-secret
```

Then restart `npm run dev`.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add these Environment Variables in Vercel:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `AUTH_SECRET`
4. Deploy.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/products`
- `POST /api/products/admin`
- `PATCH /api/products/admin/:id`
- `DELETE /api/products/admin/:id`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/admin`
- `PATCH /api/orders/admin/:id`
