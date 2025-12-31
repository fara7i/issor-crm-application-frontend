import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT', 'CONFIRMER']),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT', 'CONFIRMER']).optional(),
  isActive: z.boolean().optional(),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  sellingPrice: z.number().positive('Selling price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
  barcode: z.string().optional(),
  sellingPrice: z.number().positive('Selling price must be positive').optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

// Stock schemas
export const stockAddRemoveSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive number'),
  reason: z.string().optional(),
});

// Order schemas
export const orderItemSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().min(1, 'Customer address is required'),
  customerCity: z.string().optional(),
  deliveryPrice: z.number().min(0, 'Delivery price cannot be negative').optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
});

// Scan order schemas
export const createScannedOrderSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
  deliveryCompany: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Salary schemas
export const createSalarySchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required'),
  position: z.string().optional(),
  baseAmount: z.number().positive('Base amount must be positive'),
  bonus: z.number().min(0, 'Bonus cannot be negative').optional(),
  deductions: z.number().min(0, 'Deductions cannot be negative').optional(),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020).max(2100, 'Invalid year'),
  notes: z.string().optional(),
});

export const updateSalarySchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required').optional(),
  position: z.string().optional(),
  baseAmount: z.number().positive('Base amount must be positive').optional(),
  bonus: z.number().min(0, 'Bonus cannot be negative').optional(),
  deductions: z.number().min(0, 'Deductions cannot be negative').optional(),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12').optional(),
  year: z.number().int().min(2020).max(2100, 'Invalid year').optional(),
  notes: z.string().optional(),
  paidAt: z.string().datetime().optional().nullable(),
});

// Charge schemas
export const createChargeSchema = z.object({
  type: z.enum([
    'WATER_BILL',
    'ELECTRICITY_BILL',
    'RENT',
    'LAWYER',
    'BROKEN_PARTS',
    'MAINTENANCE',
    'OTHER',
  ]),
  customType: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  chargeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

export const updateChargeSchema = z.object({
  type: z.enum([
    'WATER_BILL',
    'ELECTRICITY_BILL',
    'RENT',
    'LAWYER',
    'BROKEN_PARTS',
    'MAINTENANCE',
    'OTHER',
  ]).optional(),
  customType: z.string().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().optional(),
  chargeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

// Ads cost schemas
export const createAdsCostSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required'),
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'OTHER']),
  cost: z.number().positive('Cost must be positive'),
  results: z.number().int().min(0, 'Results cannot be negative').optional(),
  campaignDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  notes: z.string().optional(),
});

export const updateAdsCostSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required').optional(),
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'OTHER']).optional(),
  cost: z.number().positive('Cost must be positive').optional(),
  results: z.number().int().min(0, 'Results cannot be negative').optional(),
  campaignDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  notes: z.string().optional(),
});

// Validation helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: { errors: z.ZodIssue[] } } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Wrap issues in errors property for backward compatibility
  return { success: false, errors: { errors: result.error.issues } };
}

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const productQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  sort: z.enum(['name', 'sku', 'sellingPrice', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const orderQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const salaryQuerySchema = paginationSchema.extend({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const chargeQuerySchema = paginationSchema.extend({
  type: z.enum([
    'WATER_BILL',
    'ELECTRICITY_BILL',
    'RENT',
    'LAWYER',
    'BROKEN_PARTS',
    'MAINTENANCE',
    'OTHER',
  ]).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const stockHistoryQuerySchema = paginationSchema.extend({
  productId: z.coerce.number().int().positive().optional(),
});
