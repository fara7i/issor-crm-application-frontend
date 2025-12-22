import { delay } from "./utils";
import {
  mockProducts,
  mockStock,
  mockStockHistory,
  mockOrders,
  mockSalaries,
  mockCharges,
  mockAdCampaigns,
  mockAdminUsers,
  mockSalesData,
  mockTopProducts,
} from "./mock-data";
import {
  Product,
  Stock,
  StockHistory,
  Order,
  Salary,
  Charge,
  AdCampaign,
  AdminUser,
  DashboardStats,
  SalesData,
  TopProduct,
  ApiResponse,
  PaginatedResponse,
  ProductFormData,
  StockFormData,
  OrderFormData,
  SalaryFormData,
  ChargeFormData,
  AdFormData,
  AdminFormData,
  ProductFilters,
  OrderFilters,
  ChargeFilters,
} from "@/types";
import { generateId, generateSKU, generateBarcode, generateOrderNumber } from "./utils";

// Simulate API delay (300-500ms)
const API_DELAY = () => Math.random() * 200 + 300;

// Base API URL placeholder - will be used in production
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// ============ PRODUCTS API ============

const products = [...mockProducts];

export const productsApi = {
  getAll: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    await delay(API_DELAY());

    let filteredProducts = [...products];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.barcode.includes(search)
      );
    }

    if (filters?.category) {
      filteredProducts = filteredProducts.filter(
        (p) => p.category === filters.category
      );
    }

    if (filters?.sortBy) {
      filteredProducts.sort((a, b) => {
        const order = filters.sortOrder === "desc" ? -1 : 1;
        switch (filters.sortBy) {
          case "name":
            return a.name.localeCompare(b.name) * order;
          case "price":
            return (a.sellingPrice - b.sellingPrice) * order;
          case "date":
            return (
              (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
              order
            );
          default:
            return 0;
        }
      });
    }

    return {
      data: filteredProducts,
      total: filteredProducts.length,
      page: 1,
      pageSize: filteredProducts.length,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    await delay(API_DELAY());
    const product = products.find((p) => p.id === id);
    if (product) {
      return { success: true, data: product };
    }
    return { success: false, error: "Product not found" };
  },

  getByBarcode: async (barcode: string): Promise<ApiResponse<Product>> => {
    await delay(API_DELAY());
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      return { success: true, data: product };
    }
    return { success: false, error: "Product not found" };
  },

  create: async (data: ProductFormData): Promise<ApiResponse<Product>> => {
    await delay(API_DELAY());
    const newProduct: Product = {
      id: `prod-${generateId()}`,
      ...data,
      sku: data.sku || generateSKU(data.category),
      barcode: data.barcode || generateBarcode(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    products.push(newProduct);
    return { success: true, data: newProduct, message: "Product created successfully" };
  },

  update: async (id: string, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    await delay(API_DELAY());
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: "Product not found" };
    }
    products[index] = {
      ...products[index],
      ...data,
      updatedAt: new Date(),
    };
    return { success: true, data: products[index], message: "Product updated successfully" };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(API_DELAY());
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: "Product not found" };
    }
    products.splice(index, 1);
    return { success: true, message: "Product deleted successfully" };
  },
};

// ============ STOCK API ============

const stock = [...mockStock];
const stockHistory = [...mockStockHistory];

export const stockApi = {
  getAll: async (): Promise<PaginatedResponse<Stock>> => {
    await delay(API_DELAY());
    // Update stock with current products
    const updatedStock = stock.map((s) => ({
      ...s,
      product: products.find((p) => p.id === s.productId) || s.product,
    }));
    return {
      data: updatedStock,
      total: updatedStock.length,
      page: 1,
      pageSize: updatedStock.length,
      totalPages: 1,
    };
  },

  getByProductId: async (productId: string): Promise<ApiResponse<Stock>> => {
    await delay(API_DELAY());
    const stockItem = stock.find((s) => s.productId === productId);
    if (stockItem) {
      return {
        success: true,
        data: {
          ...stockItem,
          product: products.find((p) => p.id === productId) || stockItem.product,
        },
      };
    }
    return { success: false, error: "Stock not found" };
  },

  getLowStock: async (): Promise<PaginatedResponse<Stock>> => {
    await delay(API_DELAY());
    const lowStockItems = stock
      .filter((s) => s.quantity <= s.lowStockThreshold)
      .map((s) => ({
        ...s,
        product: products.find((p) => p.id === s.productId) || s.product,
      }));
    return {
      data: lowStockItems,
      total: lowStockItems.length,
      page: 1,
      pageSize: lowStockItems.length,
      totalPages: 1,
    };
  },

  updateQuantity: async (data: StockFormData): Promise<ApiResponse<Stock>> => {
    await delay(API_DELAY());
    const index = stock.findIndex((s) => s.productId === data.productId);
    if (index === -1) {
      return { success: false, error: "Stock not found" };
    }

    const previousQuantity = stock[index].quantity;
    const newQuantity =
      data.changeType === "ADD"
        ? previousQuantity + data.quantity
        : Math.max(0, previousQuantity - data.quantity);

    stock[index] = {
      ...stock[index],
      quantity: newQuantity,
      lastUpdated: new Date(),
    };

    // Add to history
    stockHistory.unshift({
      id: `hist-${generateId()}`,
      productId: data.productId,
      product: stock[index].product,
      previousQuantity,
      newQuantity,
      changeType: data.changeType,
      reason: data.reason,
      createdAt: new Date(),
      createdBy: "Current User",
    });

    return {
      success: true,
      data: stock[index],
      message: "Stock updated successfully",
    };
  },

  getHistory: async (productId?: string): Promise<PaginatedResponse<StockHistory>> => {
    await delay(API_DELAY());
    let history = stockHistory;
    if (productId) {
      history = history.filter((h) => h.productId === productId);
    }
    return {
      data: history,
      total: history.length,
      page: 1,
      pageSize: history.length,
      totalPages: 1,
    };
  },
};

// ============ ORDERS API ============

const orders = [...mockOrders];

export const ordersApi = {
  getAll: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    await delay(API_DELAY());

    let filteredOrders = [...orders];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          o.customerPhone.includes(search)
      );
    }

    if (filters?.status) {
      filteredOrders = filteredOrders.filter((o) => o.status === filters.status);
    }

    if (filters?.dateFrom) {
      filteredOrders = filteredOrders.filter(
        (o) => new Date(o.createdAt) >= filters.dateFrom!
      );
    }

    if (filters?.dateTo) {
      filteredOrders = filteredOrders.filter(
        (o) => new Date(o.createdAt) <= filters.dateTo!
      );
    }

    // Sort by date descending
    filteredOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      data: filteredOrders,
      total: filteredOrders.length,
      page: 1,
      pageSize: filteredOrders.length,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    await delay(API_DELAY());
    const order = orders.find((o) => o.id === id);
    if (order) {
      return { success: true, data: order };
    }
    return { success: false, error: "Order not found" };
  },

  getByBarcode: async (barcode: string): Promise<ApiResponse<Order>> => {
    await delay(API_DELAY());
    const order = orders.find((o) => o.barcode === barcode);
    if (order) {
      return { success: true, data: order };
    }
    return { success: false, error: "Order not found" };
  },

  create: async (data: OrderFormData): Promise<ApiResponse<Order>> => {
    await delay(API_DELAY());

    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("Product not found");
      return {
        id: `item-${generateId()}`,
        productId: item.productId,
        product,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const newOrder: Order = {
      id: `ord-${generateId()}`,
      orderNumber: generateOrderNumber(),
      barcode: generateBarcode(),
      items: orderItems,
      status: "PENDING",
      deliveryPrice: data.deliveryPrice,
      subtotal,
      total: subtotal + data.deliveryPrice,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "Current User",
    };

    orders.unshift(newOrder);
    return { success: true, data: newOrder, message: "Order created successfully" };
  },

  updateStatus: async (
    id: string,
    status: Order["status"]
  ): Promise<ApiResponse<Order>> => {
    await delay(API_DELAY());
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      return { success: false, error: "Order not found" };
    }
    orders[index] = {
      ...orders[index],
      status,
      updatedAt: new Date(),
    };
    return {
      success: true,
      data: orders[index],
      message: "Order status updated successfully",
    };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(API_DELAY());
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      return { success: false, error: "Order not found" };
    }
    orders.splice(index, 1);
    return { success: true, message: "Order deleted successfully" };
  },
};

// ============ SALARIES API ============

const salaries = [...mockSalaries];

export const salariesApi = {
  getAll: async (): Promise<PaginatedResponse<Salary>> => {
    await delay(API_DELAY());
    return {
      data: salaries,
      total: salaries.length,
      page: 1,
      pageSize: salaries.length,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<Salary>> => {
    await delay(API_DELAY());
    const salary = salaries.find((s) => s.id === id);
    if (salary) {
      return { success: true, data: salary };
    }
    return { success: false, error: "Salary record not found" };
  },

  create: async (data: SalaryFormData): Promise<ApiResponse<Salary>> => {
    await delay(API_DELAY());
    const newSalary: Salary = {
      id: `sal-${generateId()}`,
      employeeId: `emp-${generateId()}`,
      ...data,
      netSalary: data.baseSalary + data.bonuses - data.deductions,
      status: "PENDING",
      createdAt: new Date(),
    };
    salaries.unshift(newSalary);
    return { success: true, data: newSalary, message: "Salary record created successfully" };
  },

  update: async (id: string, data: Partial<SalaryFormData>): Promise<ApiResponse<Salary>> => {
    await delay(API_DELAY());
    const index = salaries.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: "Salary record not found" };
    }
    const updated = {
      ...salaries[index],
      ...data,
    };
    if (data.baseSalary !== undefined || data.bonuses !== undefined || data.deductions !== undefined) {
      updated.netSalary =
        (data.baseSalary ?? salaries[index].baseSalary) +
        (data.bonuses ?? salaries[index].bonuses) -
        (data.deductions ?? salaries[index].deductions);
    }
    salaries[index] = updated;
    return { success: true, data: salaries[index], message: "Salary record updated successfully" };
  },

  markAsPaid: async (id: string): Promise<ApiResponse<Salary>> => {
    await delay(API_DELAY());
    const index = salaries.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: "Salary record not found" };
    }
    salaries[index] = {
      ...salaries[index],
      status: "PAID",
      paidAt: new Date(),
    };
    return { success: true, data: salaries[index], message: "Salary marked as paid" };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(API_DELAY());
    const index = salaries.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: "Salary record not found" };
    }
    salaries.splice(index, 1);
    return { success: true, message: "Salary record deleted successfully" };
  },
};

// ============ CHARGES API ============

const charges = [...mockCharges];

export const chargesApi = {
  getAll: async (filters?: ChargeFilters): Promise<PaginatedResponse<Charge>> => {
    await delay(API_DELAY());

    let filteredCharges = [...charges];

    if (filters?.category) {
      filteredCharges = filteredCharges.filter((c) => c.category === filters.category);
    }

    if (filters?.dateFrom) {
      filteredCharges = filteredCharges.filter(
        (c) => new Date(c.date) >= filters.dateFrom!
      );
    }

    if (filters?.dateTo) {
      filteredCharges = filteredCharges.filter(
        (c) => new Date(c.date) <= filters.dateTo!
      );
    }

    // Sort by date descending
    filteredCharges.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      data: filteredCharges,
      total: filteredCharges.length,
      page: 1,
      pageSize: filteredCharges.length,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<Charge>> => {
    await delay(API_DELAY());
    const charge = charges.find((c) => c.id === id);
    if (charge) {
      return { success: true, data: charge };
    }
    return { success: false, error: "Charge not found" };
  },

  create: async (data: ChargeFormData): Promise<ApiResponse<Charge>> => {
    await delay(API_DELAY());
    const newCharge: Charge = {
      id: `chg-${generateId()}`,
      ...data,
      createdAt: new Date(),
      createdBy: "Current User",
    };
    charges.unshift(newCharge);
    return { success: true, data: newCharge, message: "Charge created successfully" };
  },

  update: async (id: string, data: Partial<ChargeFormData>): Promise<ApiResponse<Charge>> => {
    await delay(API_DELAY());
    const index = charges.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: "Charge not found" };
    }
    charges[index] = {
      ...charges[index],
      ...data,
    };
    return { success: true, data: charges[index], message: "Charge updated successfully" };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(API_DELAY());
    const index = charges.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: "Charge not found" };
    }
    charges.splice(index, 1);
    return { success: true, message: "Charge deleted successfully" };
  },

  getTotalByCategory: async (): Promise<ApiResponse<Record<string, number>>> => {
    await delay(API_DELAY());
    const totals = charges.reduce((acc, charge) => {
      const category = charge.category === "Other" && charge.customCategory
        ? charge.customCategory
        : charge.category;
      acc[category] = (acc[category] || 0) + charge.amount;
      return acc;
    }, {} as Record<string, number>);
    return { success: true, data: totals };
  },
};

// ============ ADS API ============

const adCampaigns = [...mockAdCampaigns];

export const adsApi = {
  getAll: async (): Promise<PaginatedResponse<AdCampaign>> => {
    await delay(API_DELAY());
    return {
      data: adCampaigns,
      total: adCampaigns.length,
      page: 1,
      pageSize: adCampaigns.length,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<AdCampaign>> => {
    await delay(API_DELAY());
    const campaign = adCampaigns.find((a) => a.id === id);
    if (campaign) {
      return { success: true, data: campaign };
    }
    return { success: false, error: "Campaign not found" };
  },

  create: async (data: AdFormData): Promise<ApiResponse<AdCampaign>> => {
    await delay(API_DELAY());
    const newCampaign: AdCampaign = {
      id: `ad-${generateId()}`,
      ...data,
      costPerResult: data.results > 0 ? data.cost / data.results : 0,
      createdAt: new Date(),
    };
    adCampaigns.unshift(newCampaign);
    return { success: true, data: newCampaign, message: "Campaign created successfully" };
  },

  update: async (id: string, data: Partial<AdFormData>): Promise<ApiResponse<AdCampaign>> => {
    await delay(API_DELAY());
    const index = adCampaigns.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: "Campaign not found" };
    }
    const updated = {
      ...adCampaigns[index],
      ...data,
    };
    if (data.cost !== undefined || data.results !== undefined) {
      const cost = data.cost ?? adCampaigns[index].cost;
      const results = data.results ?? adCampaigns[index].results;
      updated.costPerResult = results > 0 ? cost / results : 0;
    }
    adCampaigns[index] = updated;
    return { success: true, data: adCampaigns[index], message: "Campaign updated successfully" };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(API_DELAY());
    const index = adCampaigns.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: "Campaign not found" };
    }
    adCampaigns.splice(index, 1);
    return { success: true, message: "Campaign deleted successfully" };
  },
};

// ============ ADMINS API ============

const adminUsers = [...mockAdminUsers];

export const adminsApi = {
  getAll: async (): Promise<PaginatedResponse<AdminUser>> => {
    await delay(API_DELAY());
    return {
      data: adminUsers,
      total: adminUsers.length,
      page: 1,
      pageSize: adminUsers.length,
      totalPages: 1,
    };
  },

  getById: async (id: string): Promise<ApiResponse<AdminUser>> => {
    await delay(API_DELAY());
    const admin = adminUsers.find((a) => a.id === id);
    if (admin) {
      return { success: true, data: admin };
    }
    return { success: false, error: "Admin not found" };
  },

  create: async (data: AdminFormData): Promise<ApiResponse<AdminUser>> => {
    await delay(API_DELAY());
    const newAdmin: AdminUser = {
      id: `admin-${generateId()}`,
      name: data.name,
      email: data.email,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date(),
    };
    adminUsers.unshift(newAdmin);
    return { success: true, data: newAdmin, message: "Admin created successfully" };
  },

  update: async (id: string, data: Partial<AdminFormData>): Promise<ApiResponse<AdminUser>> => {
    await delay(API_DELAY());
    const index = adminUsers.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: "Admin not found" };
    }
    adminUsers[index] = {
      ...adminUsers[index],
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
    };
    return { success: true, data: adminUsers[index], message: "Admin updated successfully" };
  },

  toggleStatus: async (id: string): Promise<ApiResponse<AdminUser>> => {
    await delay(API_DELAY());
    const index = adminUsers.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: "Admin not found" };
    }
    adminUsers[index] = {
      ...adminUsers[index],
      status: adminUsers[index].status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    };
    return { success: true, data: adminUsers[index], message: "Admin status updated" };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(API_DELAY());
    const index = adminUsers.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: "Admin not found" };
    }
    adminUsers.splice(index, 1);
    return { success: true, message: "Admin deleted successfully" };
  },
};

// ============ DASHBOARD API ============

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    await delay(API_DELAY());
    // Calculate actual stats from mock data
    const totalOrders = orders.filter((o) => o.status !== "CANCELLED").length;
    const totalRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.total, 0);
    const lowStockItems = stock.filter((s) => s.quantity <= s.lowStockThreshold).length;

    return {
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        productsCount: products.length,
        lowStockItems,
        revenueChange: 12.5,
        ordersChange: 8.3,
      },
    };
  },

  getSalesData: async (): Promise<ApiResponse<SalesData[]>> => {
    await delay(API_DELAY());
    return { success: true, data: mockSalesData };
  },

  getTopProducts: async (): Promise<ApiResponse<TopProduct[]>> => {
    await delay(API_DELAY());
    return { success: true, data: mockTopProducts };
  },

  getRecentOrders: async (limit: number = 10): Promise<ApiResponse<Order[]>> => {
    await delay(API_DELAY());
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return { success: true, data: recentOrders };
  },
};
