# Expense Tracker — API & Web App

A full-stack personal finance application built with Node.js, Express, MongoDB, and Vanilla JavaScript. Covers the complete cycle from secure user authentication to transaction management, custom categories, and interactive data visualization — all without a frontend framework.

---

## Overview

This project is a complete expense management system that allows users to:

- Create an account and securely authenticate
- Add, edit, view, and delete financial transactions
- Organize transactions with custom categories (with emoji icons and type filters)
- Search, filter, and paginate through transaction history
- Visualize spending patterns using three Chart.js charts
- Toggle between light and dark mode
- Use the app fully on mobile

It combines a RESTful backend API with a lightweight, responsive frontend — focusing on clean architecture, security best practices, and a polished user experience without reaching for a JS framework.

---

## Features

### Authentication & Security
- User registration and login with password hashing via bcrypt
- JWT-based authentication with protected routes
- **MongoDB-backed token blacklist** — invalidated tokens persist across server restarts
- **Rate limiting** on auth routes (10 requests / 15 min) via `express-rate-limit`
- **Zod v4 input validation** on all write endpoints — coerces types and returns readable errors

### Transaction Management
- Add, edit, and delete income or expense transactions
- **Category dropdown** populated from the user's own saved categories, filtered by transaction type
- **Search** by description or category (case-insensitive regex)
- **Filter** by type (income / expense) and date range
- **Pagination** — configurable page size, returns total pages and navigation flags
- Compound MongoDB indexes on `userId + date` and `userId + type` for fast filtered queries

### Custom Categories
- Full CRUD — create categories with a name, emoji icon, and type (income / expense / both)
- Categories feed directly into the transaction form dropdown
- Categories page with card grid, skeleton loaders, and empty state

### Data Visualization (Summary Page)
- **Doughnut chart** — expenses broken down by category
- **Bar chart** — total income vs expenses vs balance
- **Line chart** — 6-month income and expense trend
- **Date range filter** — re-fetches and re-renders all charts on change; chart instances destroyed before redraw to prevent duplicates

### UI & UX
- Tailwind CSS v3 (installed locally, not CDN) with a custom `app.css` for dynamic DOM elements
- **Dark mode** with flash-free initialization (inline `<script>` sets class before render)
- **Hamburger sidebar** for mobile with overlay and close button
- **Skeleton loaders** on all data areas while fetching
- **Empty states** with contextual messages when no data exists
- **Toast notifications** (success / error / info) — global `window.showToast()`
- **Confirm-delete modals** replacing native `confirm()` dialogs
- Consistent currency formatting via `window.fmt()` using `Intl.NumberFormat` (₦)
- Fully mobile-responsive layout — fixed sidebar, `md:ml-60` content offset, responsive filter bar, stacked forms on small screens

### Landing Page
- Serves as a project README/showcase — hero section, feature cards, tech stack badges, full API reference table, and CTA

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | HTTP server & routing |
| MongoDB + Mongoose | Database + ODM |
| jsonwebtoken | JWT auth |
| bcrypt | Password hashing |
| Zod v4 | Input validation |
| express-rate-limit | Auth route rate limiting |
| dotenv | Environment config |
| nodemon | Dev auto-restart |
| concurrently | Run server + CSS watcher together |

### Frontend
| Tool | Purpose |
|---|---|
| Vanilla JavaScript | All interactivity |
| Tailwind CSS v3 | Utility-first styling |
| Chart.js | Data visualization |
| Poppins (Google Fonts) | Typography |

---

## Project Structure

```
Expense-Tracker/
├── config/
│   └── db.js                      # MongoDB connection
├── controllers/
│   ├── userController.js
│   ├── transactionController.js   # Includes filters, pagination, summary
│   └── categoryController.js
├── middleware/
│   ├── auth.js                    # JWT verify + blacklist check
│   └── validate.js                # Reusable Zod validation middleware
├── models/
│   ├── userModel.js
│   ├── transactionModel.js        # Compound DB indexes
│   ├── categoryModel.js
│   └── blacklistedTokenModel.js   # TTL collection (7d auto-expire)
├── routes/
│   ├── userRoutes.js              # Rate-limited auth routes
│   ├── transactionRoutes.js
│   └── categoryRoutes.js
├── validators/
│   ├── userValidators.js
│   ├── transactionValidators.js   # Uses z.coerce for HTML form inputs
│   └── categoryValidators.js
├── public/
│   ├── index.html                 # Landing/showcase page
│   ├── dashboard.html
│   ├── transactions.html
│   ├── summary.html
│   ├── categories.html
│   ├── signIn.html
│   ├── signUp.html
│   ├── css/
│   │   ├── tailwind.input.css     # Tailwind source
│   │   ├── tailwind.output.css    # Built output (gitignored)
│   │   └── app.css                # Tables, modals, toasts, cards, animations
│   └── js/
│       ├── toast.js               # Global showToast() + fmt() currency formatter
│       ├── theme.js               # Dark mode toggle + hamburger sidebar
│       ├── dashboard.js
│       ├── transactions.js
│       ├── summary.js
│       └── categories.js
├── tailwind.config.js
├── app.js                         # Express entry point + page routes
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB running locally or via Atlas

### Installation

```bash
git clone https://github.com/HajayB/Expense-Tracker.git
cd Expense-Tracker
npm install
```

### Build CSS

Tailwind is installed locally. Build the output file before running:

```bash
npm run build:css
```

### Environment Variables

Create a `.env` file in the root:

```
PORT=3800
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Run

```bash
# Production
npm start

# Development (nodemon + Tailwind watch in parallel)
npm run dev
```

Then open: `http://localhost:3800`

---

## API Reference

All endpoints below `/api/users/profile`, `/api/transactions`, and `/api/categories` require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/signup` | Register user |
| POST | `/api/users/login` | Login user |
| POST | `/api/users/logout` | Logout (blacklists token) |
| GET | `/api/users/profile` | Get logged-in user profile |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | Get transactions — supports `?type`, `?search`, `?startDate`, `?endDate`, `?page`, `?limit` |
| GET | `/api/transactions/summary` | Get totals, category breakdown, 6-month trend — supports `?startDate`, `?endDate` |
| POST | `/api/transactions` | Add transaction |
| PUT | `/api/transactions/:id` | Edit transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

#### Paginated response shape
```json
{
  "transactions": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Summary response shape
```json
{
  "balance": 150000,
  "income": 300000,
  "expenses": 150000,
  "totalTransactions": 24,
  "expensesByCategory": { "Food": 40000, "Transport": 20000 },
  "monthly": [
    { "label": "Jan 25", "income": 50000, "expenses": 30000 }
  ]
}
```

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Get all categories for user |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

---

## Key Highlights

- Clean MVC separation — routes, controllers, middleware, models, validators each in their own layer
- Real-world auth flow — JWT + bcrypt + MongoDB token blacklist that survives server restarts
- Zod validation with `z.coerce` handles the string-to-number mismatch from HTML form inputs without extra parsing
- Tailwind scans `.html` and `.js` files; dynamically built table rows and toasts are styled in `app.css` since Tailwind can't scan JS template literals at build time
- Chart instances tracked and destroyed before re-render — prevents memory leaks and duplicate overlays on date range changes
- No frontend framework — all DOM updates, state, and routing done in vanilla JS

---

## Author

**Basit Adeola Ajayi**
GitHub: [https://github.com/HajayB](https://github.com/HajayB)
