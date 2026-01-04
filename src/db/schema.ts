import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  pgEnum,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'ADMIN',
  'SHOP_AGENT',
  'WAREHOUSE_AGENT',
  'CONFIRMER',
]);

export const stockHistoryTypeEnum = pgEnum('stock_history_type', [
  'ADD',
  'REMOVE',
  'ADJUSTMENT',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'UNPAID',
  'PAID',
  'REFUNDED',
]);

export const chargeTypeEnum = pgEnum('charge_type', [
  'WATER_BILL',
  'ELECTRICITY_BILL',
  'RENT',
  'LAWYER',
  'BROKEN_PARTS',
  'MAINTENANCE',
  'OTHER',
]);

export const adPlatformEnum = pgEnum('ad_platform', [
  'FACEBOOK',
  'INSTAGRAM',
  'GOOGLE',
  'TIKTOK',
  'SNAPCHAT',
  'OTHER',
]);

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 50 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('SHOP_AGENT'),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  barcode: varchar('barcode', { length: 100 }).unique(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  barcodeIdx: index('products_barcode_idx').on(table.barcode),
  isActiveIdx: index('products_is_active_idx').on(table.isActive),
  createdAtIdx: index('products_created_at_idx').on(table.createdAt),
}));

export const stock = pgTable('stock', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  quantity: integer('quantity').default(0).notNull(),
  warehouseLocation: varchar('warehouse_location', { length: 100 }),
  minStockLevel: integer('min_stock_level').default(10),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  productIdIdx: index('stock_product_id_idx').on(table.productId),
  quantityIdx: index('stock_quantity_idx').on(table.quantity),
}));

export const stockHistory = pgTable('stock_history', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  quantityChange: integer('quantity_change').notNull(),
  type: stockHistoryTypeEnum('type').notNull(),
  reason: text('reason'),
  previousQuantity: integer('previous_quantity'),
  newQuantity: integer('new_quantity'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 100 }).unique().notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerAddress: text('customer_address').notNull(),
  customerCity: varchar('customer_city', { length: 100 }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryPrice: decimal('delivery_price', { precision: 10, scale: 2 }).default('0'),
  status: orderStatusEnum('status').default('PENDING'),
  paymentStatus: paymentStatusEnum('payment_status').default('UNPAID'),
  notes: text('notes'),
  isFromShop: boolean('is_from_shop').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusIdx: index('orders_status_idx').on(table.status),
  paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  createdByIdx: index('orders_created_by_idx').on(table.createdBy),
  isFromShopIdx: index('orders_is_from_shop_idx').on(table.isFromShop),
}));

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  productIdIdx: index('order_items_product_id_idx').on(table.productId),
}));

export const salaries = pgTable('salaries', {
  id: serial('id').primaryKey(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  position: varchar('position', { length: 100 }),
  baseAmount: decimal('base_amount', { precision: 10, scale: 2 }).notNull(),
  bonus: decimal('bonus', { precision: 10, scale: 2 }).default('0'),
  deductions: decimal('deductions', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  notes: text('notes'),
  paidAt: timestamp('paid_at'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const charges = pgTable('charges', {
  id: serial('id').primaryKey(),
  type: chargeTypeEnum('type').notNull(),
  customType: varchar('custom_type', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  chargeDate: date('charge_date').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adsCosts = pgTable('ads_costs', {
  id: serial('id').primaryKey(),
  campaignName: varchar('campaign_name', { length: 255 }).notNull(),
  platform: adPlatformEnum('platform').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  results: integer('results').default(0),
  costPerResult: decimal('cost_per_result', { precision: 10, scale: 2 }),
  campaignDate: date('campaign_date').notNull(),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scannedOrders = pgTable('scanned_orders', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  deliveryCompany: varchar('delivery_company', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  scannedBy: integer('scanned_by')
    .references(() => users.id)
    .notNull(),
  scannedAt: timestamp('scanned_at').defaultNow(),
  notes: text('notes'),
}, (table) => ({
  orderIdIdx: index('scanned_orders_order_id_idx').on(table.orderId),
  scannedByIdx: index('scanned_orders_scanned_by_idx').on(table.scannedBy),
  scannedAtIdx: index('scanned_orders_scanned_at_idx').on(table.scannedAt),
}));

export const productDeliveryStats = pgTable('product_delivery_stats', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull()
    .unique(),
  totalOrders: integer('total_orders').default(0),
  deliveredOrders: integer('delivered_orders').default(0),
  cancelledOrders: integer('cancelled_orders').default(0),
  returnedOrders: integer('returned_orders').default(0),
  inTransitOrders: integer('in_transit_orders').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  orders: many(orders),
  stockHistory: many(stockHistory),
  salaries: many(salaries),
  charges: many(charges),
  adsCosts: many(adsCosts),
  scannedOrders: many(scannedOrders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
  stock: one(stock, {
    fields: [products.id],
    references: [stock.productId],
  }),
  stockHistory: many(stockHistory),
  orderItems: many(orderItems),
  deliveryStats: one(productDeliveryStats, {
    fields: [products.id],
    references: [productDeliveryStats.productId],
  }),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, {
    fields: [stock.productId],
    references: [products.id],
  }),
}));

export const stockHistoryRelations = relations(stockHistory, ({ one }) => ({
  product: one(products, {
    fields: [stockHistory.productId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [stockHistory.createdBy],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  items: many(orderItems),
  scannedOrder: one(scannedOrders, {
    fields: [orders.id],
    references: [scannedOrders.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const salariesRelations = relations(salaries, ({ one }) => ({
  createdByUser: one(users, {
    fields: [salaries.createdBy],
    references: [users.id],
  }),
}));

export const chargesRelations = relations(charges, ({ one }) => ({
  createdByUser: one(users, {
    fields: [charges.createdBy],
    references: [users.id],
  }),
}));

export const adsCostsRelations = relations(adsCosts, ({ one }) => ({
  createdByUser: one(users, {
    fields: [adsCosts.createdBy],
    references: [users.id],
  }),
}));

export const scannedOrdersRelations = relations(scannedOrders, ({ one }) => ({
  order: one(orders, {
    fields: [scannedOrders.orderId],
    references: [orders.id],
  }),
  scannedByUser: one(users, {
    fields: [scannedOrders.scannedBy],
    references: [users.id],
  }),
}));

export const productDeliveryStatsRelations = relations(productDeliveryStats, ({ one }) => ({
  product: one(products, {
    fields: [productDeliveryStats.productId],
    references: [products.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Stock = typeof stock.$inferSelect;
export type NewStock = typeof stock.$inferInsert;
export type StockHistory = typeof stockHistory.$inferSelect;
export type NewStockHistory = typeof stockHistory.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Salary = typeof salaries.$inferSelect;
export type NewSalary = typeof salaries.$inferInsert;
export type Charge = typeof charges.$inferSelect;
export type NewCharge = typeof charges.$inferInsert;
export type AdsCost = typeof adsCosts.$inferSelect;
export type NewAdsCost = typeof adsCosts.$inferInsert;
export type ScannedOrder = typeof scannedOrders.$inferSelect;
export type NewScannedOrder = typeof scannedOrders.$inferInsert;
export type ProductDeliveryStats = typeof productDeliveryStats.$inferSelect;
export type NewProductDeliveryStats = typeof productDeliveryStats.$inferInsert;
