// User and Auth Types
export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SHOP_AGENT"
  | "WAREHOUSE_AGENT"
  | "CONFIRMER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  sellingPrice: number;
  costPrice: number;
  imageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory =
  | "Electronics"
  | "Clothing"
  | "Food"
  | "Beauty"
  | "Home"
  | "Sports"
  | "Books"
  | "Toys"
  | "Other";

export interface ProductFormData {
  name: string;
  sku?: string;
  barcode?: string;
  category: ProductCategory;
  sellingPrice: number;
  costPrice: number;
  imageUrl?: string;
  description?: string;
}

// Stock Types
export interface Stock {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  lowStockThreshold: number;
  lastUpdated: Date;
}

export interface StockHistory {
  id: string;
  productId: string;
  product: Product;
  previousQuantity: number;
  newQuantity: number;
  changeType: "ADD" | "REMOVE" | "ADJUST";
  reason?: string;
  createdAt: Date;
  createdBy: string;
}

export interface StockFormData {
  productId: string;
  quantity: number;
  changeType: "ADD" | "REMOVE";
  reason?: string;
}

// Order Types
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  barcode: string;
  items: OrderItem[];
  status: OrderStatus;
  deliveryPrice: number;
  subtotal: number;
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface OrderFormData {
  items: {
    productId: string;
    quantity: number;
  }[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryPrice: number;
  notes?: string;
}

// Salary Types
export interface Salary {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: number;
  status: "PENDING" | "PAID";
  paidAt?: Date;
  createdAt: Date;
}

export interface SalaryFormData {
  employeeName: string;
  employeeRole: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  month: string;
  year: number;
}

// Charge Types
export type ChargeCategory =
  | "Lawyer"
  | "Water Bill"
  | "Electricity"
  | "Broken Parts"
  | "Other";

export interface Charge {
  id: string;
  category: ChargeCategory;
  customCategory?: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ChargeFormData {
  category: ChargeCategory;
  customCategory?: string;
  amount: number;
  description: string;
  date: Date;
}

// Ad Cost Types
export type AdPlatform =
  | "Facebook"
  | "Instagram"
  | "Google"
  | "TikTok"
  | "YouTube"
  | "Other";

export interface AdCampaign {
  id: string;
  name: string;
  platform: AdPlatform;
  cost: number;
  results: number;
  costPerResult: number;
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: Date;
}

export interface AdFormData {
  name: string;
  platform: AdPlatform;
  cost: number;
  results: number;
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
}

// Dashboard Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  productsCount: number;
  lowStockItems: number;
  revenueChange: number;
  ordersChange: number;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

// Admin User Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  lastLogin?: Date;
}

export interface AdminFormData {
  name: string;
  email: string;
  password: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter Types
export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  sortBy?: "name" | "price" | "date";
  sortOrder?: "asc" | "desc";
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ChargeFilters {
  category?: ChargeCategory;
  dateFrom?: Date;
  dateTo?: Date;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

// Table Types
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}
