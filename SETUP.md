# ISSOR CRM Inventory Management - Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Test Database Connection
```bash
npm run db:test
```

### 3. Push Schema to Database
```bash
npm run db:push
```

### 4. Seed Initial Data
```bash
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@magazine.ma | Admin123! |
| Admin | admin@magazine.ma | Admin123! |
| Shop Agent | shop@magazine.ma | Shop123! |
| Warehouse Agent | warehouse@magazine.ma | Warehouse123! |
| Confirmer | confirmer@magazine.ma | Confirm123! |

## Database Scripts

| Command | Description |
|---------|-------------|
| `npm run db:test` | Test database connection |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed initial data (users, products, stock) |

## Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL=postgresql://...your-neon-connection-string...
JWT_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Drizzle ORM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Zod

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (paginated, filterable)
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product by ID
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Soft delete product
- `POST /api/products/import-csv` - Import products from CSV

### Stock
- `GET /api/stock` - List all stock
- `POST /api/stock/add` - Add stock
- `POST /api/stock/remove` - Remove stock
- `GET /api/stock/history` - Stock history

### Orders
- `GET /api/orders` - List orders (paginated, filterable)
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order by ID
- `PUT /api/orders/[id]` - Update order
- `PUT /api/orders/[id]/status` - Update order status
- `GET /api/orders/stats` - Order statistics

### Scan Orders
- `GET /api/scan-orders` - List scanned orders
- `POST /api/scan-orders` - Scan an order

### Salaries
- `GET /api/salaries` - List salaries
- `POST /api/salaries` - Create salary record
- `PUT /api/salaries/[id]` - Update salary
- `DELETE /api/salaries/[id]` - Delete salary

### Charges
- `GET /api/charges` - List charges
- `POST /api/charges` - Create charge
- `PUT /api/charges/[id]` - Update charge
- `DELETE /api/charges/[id]` - Delete charge

### Ads Costs
- `GET /api/ads-costs` - List ad campaigns
- `POST /api/ads-costs` - Create campaign
- `PUT /api/ads-costs/[id]` - Update campaign
- `DELETE /api/ads-costs/[id]` - Delete campaign

### Admins
- `GET /api/admins` - List admins (SUPER_ADMIN only)
- `POST /api/admins` - Create admin
- `PUT /api/admins/[id]` - Update admin
- `DELETE /api/admins/[id]` - Deactivate admin

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

## Role Permissions

| Resource | SUPER_ADMIN | ADMIN | SHOP_AGENT | WAREHOUSE_AGENT | CONFIRMER |
|----------|-------------|-------|------------|-----------------|-----------|
| Products (CRUD) | Full | Full | Read | - | - |
| Stock | Full | Full | - | - | - |
| Orders | Full | Full | Create/Read Own | Read/Update Status | - |
| Scan Orders | Full | Full | - | Full | - |
| Salaries | Full | Full | - | - | - |
| Charges | Full | Full | - | - | - |
| Ads Costs | Full | Full | - | - | - |
| Admins | Full | - | - | - | - |
| Dashboard | Full | Full | - | - | - |

## Troubleshooting

### Database Connection Failed
1. Check your `DATABASE_URL` in `.env.local`
2. Ensure Neon database is running
3. Run `npm run db:test` to verify connection

### Migration Errors
1. Run `npm run db:generate` to generate migrations
2. Run `npm run db:push` to apply changes
3. Check Drizzle Studio: `npm run db:studio`

### Login Not Working
1. Ensure database is seeded: `npm run db:seed`
2. Check JWT_SECRET is set in `.env.local`
3. Clear browser localStorage and try again
