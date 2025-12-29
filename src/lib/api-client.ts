// Real API client - connects to Next.js API routes with Drizzle/Neon backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Get token from localStorage (client-side only)
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// API Error class
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Base fetch function with auth
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data.details
    );
  }

  return data;
}

// ============ AUTH API ============
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchAPI<{ token: string; user: { id: number; email: string; name: string; role: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
  },

  getMe: async () => {
    return fetchAPI<{ user: { id: number; email: string; name: string; role: string } }>(
      '/api/auth/me'
    );
  },
};

// ============ PRODUCTS API ============
export const productsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    return fetchAPI<{
      products: Array<{
        id: number;
        name: string;
        sku: string;
        barcode: string | null;
        sellingPrice: string;
        costPrice: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        stockQuantity: number | null;
        minStockLevel: number | null;
        warehouseLocation: string | null;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/products?${searchParams}`);
  },

  getById: async (id: number) => {
    return fetchAPI<{ product: unknown }>(`/api/products/${id}`);
  },

  create: async (data: {
    name: string;
    sku: string;
    barcode?: string;
    sellingPrice: number;
    costPrice: number;
    description?: string;
    imageUrl?: string;
  }) => {
    return fetchAPI<{ product: unknown }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    name: string;
    sku: string;
    barcode: string;
    sellingPrice: number;
    costPrice: number;
    description: string;
    imageUrl: string;
  }>) => {
    return fetchAPI<{ product: unknown }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  importCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();

    const response = await fetch(`${API_BASE}/api/products/import-csv`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.error || 'Import failed', response.status);
    }
    return data;
  },
};

// ============ STOCK API ============
export const stockAPI = {
  getAll: async (lowStockOnly?: boolean) => {
    const params = lowStockOnly ? '?lowStock=true' : '';
    return fetchAPI<{
      stock: Array<{
        id: number;
        productId: number;
        quantity: number;
        minStockLevel: number;
        warehouseLocation: string | null;
        lastUpdated: string;
        productName: string;
        productSku: string;
        productBarcode: string | null;
        sellingPrice: string;
        costPrice: string;
      }>;
      stats: {
        totalProducts: number;
        totalUnits: number;
        lowStockCount: number;
        outOfStockCount: number;
        totalValue: number;
      };
    }>(`/api/stock${params}`);
  },

  add: async (data: { productId: number; quantity: number; reason?: string }) => {
    return fetchAPI<{ stock: unknown; message: string }>('/api/stock/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  remove: async (data: { productId: number; quantity: number; reason?: string }) => {
    return fetchAPI<{ stock: unknown; message: string }>('/api/stock/remove', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistory: async (params?: { productId?: number; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.set('productId', params.productId.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return fetchAPI<{
      history: Array<{
        id: number;
        productId: number;
        quantityChange: number;
        type: string;
        reason: string | null;
        previousQuantity: number;
        newQuantity: number;
        createdAt: string;
        productName: string;
        productSku: string;
        createdByName: string | null;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/stock/history?${searchParams}`);
  },
};

// Order type from API
interface APIOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string | null;
  totalAmount: string;
  deliveryPrice: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    productName: string | null;
    productSku: string | null;
  }>;
}

// ============ ORDERS API ============
export const ordersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus);
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);

    return fetchAPI<{
      orders: Array<APIOrder>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/orders?${searchParams}`);
  },

  getById: async (id: number) => {
    return fetchAPI<{ order: unknown }>(`/api/orders/${id}`);
  },

  create: async (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity?: string;
    deliveryPrice?: number;
    items: Array<{ productId: number; quantity: number }>;
    notes?: string;
  }) => {
    return fetchAPI<{ order: unknown }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: {
    status?: string;
    paymentStatus?: string;
    notes?: string;
  }) => {
    return fetchAPI<{ order: unknown }>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: number, status: string) => {
    return fetchAPI<{ order: unknown; message: string }>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getStats: async () => {
    return fetchAPI<{
      stats: {
        totalOrders: number;
        pendingOrders: number;
        deliveredOrders: number;
        totalRevenue: number;
        todayRevenue: number;
        todayOrders: number;
        ordersByStatus: Array<{ status: string; count: number }>;
        revenueByMonth: Array<{ month: string; revenue: number; count: number }>;
      };
    }>('/api/orders/stats');
  },
};

// ============ SCAN ORDERS API ============
export const scanOrdersAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return fetchAPI<{
      scannedOrders: Array<unknown>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      todayScans: number;
    }>(`/api/scan-orders?${searchParams}`);
  },

  scan: async (data: {
    orderId: number;
    deliveryCompany?: string;
    trackingNumber?: string;
    notes?: string;
  }) => {
    return fetchAPI<{ scannedOrder: unknown; message: string }>('/api/scan-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============ SALARIES API ============
export const salariesAPI = {
  getAll: async (params?: { page?: number; limit?: number; month?: number; year?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.month) searchParams.set('month', params.month.toString());
    if (params?.year) searchParams.set('year', params.year.toString());

    return fetchAPI<{
      salaries: Array<unknown>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      stats: {
        totalPaid: number;
        totalPending: number;
        paidCount: number;
        pendingCount: number;
      };
    }>(`/api/salaries?${searchParams}`);
  },

  create: async (data: {
    employeeName: string;
    position?: string;
    baseAmount: number;
    bonus?: number;
    deductions?: number;
    month: number;
    year: number;
    notes?: string;
  }) => {
    return fetchAPI<{ salary: unknown }>('/api/salaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    employeeName: string;
    position: string;
    baseAmount: number;
    bonus: number;
    deductions: number;
    month: number;
    year: number;
    notes: string;
    paidAt: string | null;
  }>) => {
    return fetchAPI<{ salary: unknown }>(`/api/salaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI<{ success: boolean }>(`/api/salaries/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ CHARGES API ============
export const chargesAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);

    return fetchAPI<{
      charges: Array<unknown>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      summary: {
        byType: Array<{ type: string; total: number; count: number }>;
        totalAmount: number;
      };
    }>(`/api/charges?${searchParams}`);
  },

  create: async (data: {
    type: string;
    customType?: string;
    amount: number;
    description?: string;
    chargeDate: string;
  }) => {
    return fetchAPI<{ charge: unknown }>('/api/charges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    type: string;
    customType: string;
    amount: number;
    description: string;
    chargeDate: string;
  }>) => {
    return fetchAPI<{ charge: unknown }>(`/api/charges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI<{ success: boolean }>(`/api/charges/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ ADS COSTS API ============
export const adsCostsAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return fetchAPI<{
      adsCosts: Array<unknown>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      summary: {
        byPlatform: Array<{ platform: string; totalCost: number; totalResults: number; count: number }>;
        totalCost: number;
        totalResults: number;
        avgCostPerResult: number;
      };
    }>(`/api/ads-costs?${searchParams}`);
  },

  create: async (data: {
    campaignName: string;
    platform: string;
    cost: number;
    results?: number;
    campaignDate: string;
    notes?: string;
  }) => {
    return fetchAPI<{ adsCost: unknown }>('/api/ads-costs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    campaignName: string;
    platform: string;
    cost: number;
    results: number;
    campaignDate: string;
    notes: string;
  }>) => {
    return fetchAPI<{ adsCost: unknown }>(`/api/ads-costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI<{ success: boolean }>(`/api/ads-costs/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ ADMINS API ============
export const adminsAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return fetchAPI<{
      admins: Array<{
        id: number;
        email: string;
        name: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admins?${searchParams}`);
  },

  create: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => {
    return fetchAPI<{ admin: unknown }>('/api/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    email: string;
    password: string;
    name: string;
    role: string;
    isActive: boolean;
  }>) => {
    return fetchAPI<{ admin: unknown }>(`/api/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchAPI<{ success: boolean }>(`/api/admins/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ DASHBOARD API ============
export const dashboardAPI = {
  getStats: async () => {
    return fetchAPI<{
      stats: {
        totalProducts: number;
        totalStockValue: number;
        totalStockUnits: number;
        lowStockCount: number;
        outOfStockCount: number;
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: number;
        todayRevenue: number;
        todayOrders: number;
      };
      charts: {
        ordersByStatus: Array<{ status: string; count: number }>;
        revenueByMonth: Array<{ month: string; revenue: number; count: number }>;
        topProducts: Array<{
          productId: number;
          productName: string;
          productSku: string;
          totalQuantity: number;
          totalRevenue: number;
        }>;
      };
      recentOrders: Array<{
        id: number;
        orderNumber: string;
        customerName: string;
        totalAmount: string;
        status: string;
        paymentStatus: string;
        createdAt: string;
      }>;
      lowStockProducts: Array<{
        id: number;
        name: string;
        sku: string;
        quantity: number;
        minStockLevel: number;
      }>;
    }>('/api/dashboard/stats');
  },
};

// Legacy exports for backward compatibility (mapped to new API structure)
export const productsApi = {
  getAll: async (filters?: { search?: string; category?: string; sortBy?: string; sortOrder?: string }) => {
    const result = await productsAPI.getAll({
      search: filters?.search,
      sort: filters?.sortBy,
      order: filters?.sortOrder,
    });
    // Transform API response to frontend Product type
    const transformedProducts = result.products.map(p => ({
      id: String(p.id),
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: 'Other' as const,
      sellingPrice: parseFloat(p.sellingPrice),
      costPrice: parseFloat(p.costPrice),
      imageUrl: p.imageUrl || undefined,
      description: p.description || undefined,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
    return {
      data: transformedProducts,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
  getById: async (id: string) => {
    try {
      const result = await productsAPI.getById(parseInt(id));
      return { success: true, data: result.product };
    } catch {
      return { success: false, error: 'Product not found' };
    }
  },
  getByBarcode: async (barcode: string) => {
    try {
      // Search for product by barcode
      const result = await productsAPI.getAll({ search: barcode });
      const product = result.products.find(p => p.barcode === barcode || p.sku === barcode);
      if (product) {
        return {
          success: true,
          data: {
            id: String(product.id),
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            category: 'Other' as const,
            sellingPrice: parseFloat(product.sellingPrice),
            costPrice: parseFloat(product.costPrice),
            imageUrl: product.imageUrl || undefined,
            description: product.description || undefined,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt),
          },
        };
      }
      return { success: false, error: 'Product not found' };
    } catch {
      return { success: false, error: 'Product not found' };
    }
  },
  create: async (data: { name: string; sku?: string; barcode?: string; sellingPrice: number; costPrice: number; category: string; description?: string; imageUrl?: string }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      // Generate SKU if not provided
      const sku = data.sku || `SKU-${Date.now()}`;
      const result = await productsAPI.create({ ...data, sku });
      return { success: true, data: result.product, message: 'Product created successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      return { success: false, error: message };
    }
  },
  update: async (id: string, data: Partial<{ name: string; sku: string; barcode: string; sellingPrice: number; costPrice: number; description: string; imageUrl: string }>): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await productsAPI.update(parseInt(id), data);
      return { success: true, data: result.product, message: 'Product updated successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      return { success: false, error: message };
    }
  },
  delete: async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await productsAPI.delete(parseInt(id));
      return { success: true, message: 'Product deleted successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      return { success: false, error: message };
    }
  },
};

export const stockApi = {
  getAll: async () => {
    const result = await stockAPI.getAll();
    // Transform flat API response to nested structure expected by frontend
    const transformedStock = result.stock.map(s => ({
      id: String(s.id),
      productId: String(s.productId),
      product: {
        id: String(s.productId),
        name: s.productName,
        sku: s.productSku,
        barcode: s.productBarcode || '',
        category: 'Other' as const,
        sellingPrice: parseFloat(s.sellingPrice),
        costPrice: parseFloat(s.costPrice),
        imageUrl: undefined,
        description: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: s.quantity,
      lowStockThreshold: s.minStockLevel,
      lastUpdated: new Date(s.lastUpdated),
    }));
    return {
      data: transformedStock,
      total: transformedStock.length,
      page: 1,
      pageSize: transformedStock.length,
      totalPages: 1,
    };
  },
  getLowStock: async () => {
    const result = await stockAPI.getAll(true);
    // Transform flat API response to nested structure expected by frontend
    const transformedStock = result.stock.map(s => ({
      id: String(s.id),
      productId: String(s.productId),
      product: {
        id: String(s.productId),
        name: s.productName,
        sku: s.productSku,
        barcode: s.productBarcode || '',
        category: 'Other' as const,
        sellingPrice: parseFloat(s.sellingPrice),
        costPrice: parseFloat(s.costPrice),
        imageUrl: undefined,
        description: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: s.quantity,
      lowStockThreshold: s.minStockLevel,
      lastUpdated: new Date(s.lastUpdated),
    }));
    return {
      data: transformedStock,
      total: transformedStock.length,
      page: 1,
      pageSize: transformedStock.length,
      totalPages: 1,
    };
  },
  updateQuantity: async (data: { productId: string; quantity: number; changeType: 'ADD' | 'REMOVE'; reason?: string }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const apiCall = data.changeType === 'ADD' ? stockAPI.add : stockAPI.remove;
      const result = await apiCall({
        productId: parseInt(data.productId),
        quantity: data.quantity,
        reason: data.reason,
      });
      return { success: true, data: result.stock, message: result.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stock';
      return { success: false, error: message };
    }
  },
  getHistory: async (productId?: string) => {
    const result = await stockAPI.getHistory({ productId: productId ? parseInt(productId) : undefined });
    return {
      data: result.history,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
};

export const ordersApi = {
  getAll: async (filters?: { search?: string; status?: string; dateFrom?: Date; dateTo?: Date }) => {
    const result = await ordersAPI.getAll({
      search: filters?.search,
      status: filters?.status,
      fromDate: filters?.dateFrom?.toISOString(),
      toDate: filters?.dateTo?.toISOString(),
    });
    // Transform API response to frontend Order type
    const transformedOrders = result.orders.map(order => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      barcode: order.orderNumber, // Use order number as barcode
      status: order.status as 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED',
      deliveryPrice: parseFloat(order.deliveryPrice),
      subtotal: parseFloat(order.totalAmount) - parseFloat(order.deliveryPrice),
      total: parseFloat(order.totalAmount),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      notes: order.notes || undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      createdBy: String(order.createdBy || ''),
      items: order.items.map(item => ({
        id: String(item.id),
        productId: String(item.productId),
        product: {
          id: String(item.productId),
          name: item.productName || 'Unknown Product',
          sku: item.productSku || '',
          barcode: '',
          category: 'Other' as const,
          sellingPrice: parseFloat(item.unitPrice),
          costPrice: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.subtotal),
      })),
    }));
    return {
      data: transformedOrders,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
  getById: async (id: string) => {
    try {
      const result = await ordersAPI.getById(parseInt(id));
      return { success: true, data: result.order };
    } catch {
      return { success: false, error: 'Order not found' };
    }
  },
  getByBarcode: async (barcode: string) => {
    try {
      // Search for order by order number (which is used as barcode)
      const result = await ordersAPI.getAll({ search: barcode });
      const order = result.orders.find(o => o.orderNumber === barcode);
      if (order) {
        return {
          success: true,
          data: {
            id: String(order.id),
            orderNumber: order.orderNumber,
            barcode: order.orderNumber,
            status: order.status as 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED',
            deliveryPrice: parseFloat(order.deliveryPrice),
            subtotal: parseFloat(order.totalAmount) - parseFloat(order.deliveryPrice),
            total: parseFloat(order.totalAmount),
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            notes: order.notes || undefined,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            createdBy: String(order.createdBy || ''),
            items: order.items.map(item => ({
              id: String(item.id),
              productId: String(item.productId),
              product: {
                id: String(item.productId),
                name: item.productName || 'Unknown Product',
                sku: item.productSku || '',
                barcode: '',
                category: 'Other' as const,
                sellingPrice: parseFloat(item.unitPrice),
                costPrice: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              quantity: item.quantity,
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.subtotal),
            })),
          },
        };
      }
      return { success: false, error: 'Order not found' };
    } catch {
      return { success: false, error: 'Order not found' };
    }
  },
  create: async (data: { customerName: string; customerPhone: string; customerAddress: string; deliveryPrice: number; items: Array<{ productId: string; quantity: number }>; notes?: string }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await ordersAPI.create({
        ...data,
        items: data.items.map(item => ({ productId: parseInt(item.productId), quantity: item.quantity })),
      });
      return { success: true, data: result.order, message: 'Order created successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      return { success: false, error: message };
    }
  },
  updateStatus: async (id: string, status: string): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await ordersAPI.updateStatus(parseInt(id), status);
      return { success: true, data: result.order, message: result.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      return { success: false, error: message };
    }
  },
};

export const salariesApi = {
  getAll: async () => {
    const result = await salariesAPI.getAll();
    // Transform API response to frontend Salary type
    const transformedSalaries = (result.salaries as Array<{
      id: number;
      employeeName: string;
      position: string | null;
      baseAmount: string;
      bonus: string;
      deductions: string;
      totalAmount: string;
      month: number;
      year: number;
      notes: string | null;
      paidAt: string | null;
      createdAt: string;
    }>).map(salary => ({
      id: String(salary.id),
      employeeId: String(salary.id),
      employeeName: salary.employeeName,
      employeeRole: salary.position || '',
      baseSalary: parseFloat(salary.baseAmount),
      bonuses: parseFloat(salary.bonus),
      deductions: parseFloat(salary.deductions),
      netSalary: parseFloat(salary.totalAmount),
      month: new Date(salary.year, salary.month - 1).toLocaleString('default', { month: 'long' }),
      year: salary.year,
      status: salary.paidAt ? 'PAID' as const : 'PENDING' as const,
      paidAt: salary.paidAt ? new Date(salary.paidAt) : undefined,
      createdAt: new Date(salary.createdAt),
    }));
    return {
      data: transformedSalaries,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
  create: async (data: { employeeName: string; employeeRole: string; baseSalary: number; bonuses: number; deductions: number; month: number | string; year: number; notes?: string }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      // Convert month name to number if string
      const monthNum = typeof data.month === 'string'
        ? new Date(Date.parse(data.month + ' 1, 2000')).getMonth() + 1
        : data.month;
      const result = await salariesAPI.create({
        employeeName: data.employeeName,
        position: data.employeeRole,
        baseAmount: data.baseSalary,
        bonus: data.bonuses,
        deductions: data.deductions,
        month: monthNum,
        year: data.year,
        notes: data.notes,
      });
      return { success: true, data: result.salary, message: 'Salary record created successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create salary record';
      return { success: false, error: message };
    }
  },
  update: async (id: string, data: Partial<{ employeeName: string; employeeRole: string; baseSalary: number; bonuses: number; deductions: number; month: number | string; year: number; notes: string }>): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      // Convert month name to number if string
      const monthNum = typeof data.month === 'string'
        ? new Date(Date.parse(data.month + ' 1, 2000')).getMonth() + 1
        : data.month;
      const result = await salariesAPI.update(parseInt(id), {
        employeeName: data.employeeName,
        position: data.employeeRole,
        baseAmount: data.baseSalary,
        bonus: data.bonuses,
        deductions: data.deductions,
        month: monthNum,
        year: data.year,
        notes: data.notes,
      });
      return { success: true, data: result.salary, message: 'Salary record updated successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update salary record';
      return { success: false, error: message };
    }
  },
  markAsPaid: async (id: string): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await salariesAPI.update(parseInt(id), { paidAt: new Date().toISOString() });
      return { success: true, data: result.salary, message: 'Salary marked as paid' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark salary as paid';
      return { success: false, error: message };
    }
  },
  delete: async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await salariesAPI.delete(parseInt(id));
      return { success: true, message: 'Salary record deleted successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete salary record';
      return { success: false, error: message };
    }
  },
};

// Map frontend charge category to backend type
const chargeCategoryToType: Record<string, string> = {
  'Lawyer': 'LAWYER',
  'Water Bill': 'WATER_BILL',
  'Electricity': 'ELECTRICITY_BILL',
  'Broken Parts': 'BROKEN_PARTS',
  'Maintenance': 'MAINTENANCE',
  'Rent': 'RENT',
  'Other': 'OTHER',
};

// Map backend type to frontend category
const chargeTypeToCategory: Record<string, string> = {
  'LAWYER': 'Lawyer',
  'WATER_BILL': 'Water Bill',
  'ELECTRICITY_BILL': 'Electricity',
  'BROKEN_PARTS': 'Broken Parts',
  'MAINTENANCE': 'Other',
  'RENT': 'Other',
  'OTHER': 'Other',
};

// Map frontend platform to backend platform (uppercase)
const platformToBackend: Record<string, string> = {
  'Facebook': 'FACEBOOK',
  'Instagram': 'INSTAGRAM',
  'Google': 'GOOGLE',
  'TikTok': 'TIKTOK',
  'YouTube': 'OTHER',
  'Snapchat': 'SNAPCHAT',
  'Other': 'OTHER',
};

// Map backend platform to frontend platform
const platformToFrontend: Record<string, string> = {
  'FACEBOOK': 'Facebook',
  'INSTAGRAM': 'Instagram',
  'GOOGLE': 'Google',
  'TIKTOK': 'TikTok',
  'SNAPCHAT': 'Other',
  'OTHER': 'Other',
};

export const chargesApi = {
  getAll: async (filters?: { category?: string; dateFrom?: Date; dateTo?: Date }) => {
    const result = await chargesAPI.getAll({
      type: filters?.category ? chargeCategoryToType[filters.category] || filters.category : undefined,
      fromDate: filters?.dateFrom?.toISOString().split('T')[0],
      toDate: filters?.dateTo?.toISOString().split('T')[0],
    });
    // Transform API response to frontend Charge type
    const transformedCharges = (result.charges as Array<{
      id: number;
      type: string;
      customType: string | null;
      amount: string;
      description: string | null;
      chargeDate: string;
      createdBy: number | null;
      createdAt: string;
    }>).map(charge => ({
      id: String(charge.id),
      category: (chargeTypeToCategory[charge.type] || 'Other') as 'Lawyer' | 'Water Bill' | 'Electricity' | 'Broken Parts' | 'Other',
      customCategory: charge.customType || undefined,
      amount: parseFloat(charge.amount),
      description: charge.description || '',
      date: new Date(charge.chargeDate),
      createdAt: new Date(charge.createdAt),
      createdBy: String(charge.createdBy || ''),
    }));
    return {
      data: transformedCharges,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
  create: async (data: { category: string; customCategory?: string; amount: number; description: string; date: Date }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await chargesAPI.create({
        type: chargeCategoryToType[data.category] || 'OTHER',
        customType: data.customCategory,
        amount: data.amount,
        description: data.description,
        chargeDate: data.date.toISOString().split('T')[0],
      });
      return { success: true, data: result.charge, message: 'Charge created successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create charge';
      return { success: false, error: message };
    }
  },
  update: async (id: string, data: Partial<{ category: string; customCategory: string; amount: number; description: string; date: Date }>): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await chargesAPI.update(parseInt(id), {
        type: data.category ? chargeCategoryToType[data.category] || 'OTHER' : undefined,
        customType: data.customCategory,
        amount: data.amount,
        description: data.description,
        chargeDate: data.date?.toISOString().split('T')[0],
      });
      return { success: true, data: result.charge, message: 'Charge updated successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update charge';
      return { success: false, error: message };
    }
  },
  delete: async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await chargesAPI.delete(parseInt(id));
      return { success: true, message: 'Charge deleted successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete charge';
      return { success: false, error: message };
    }
  },
  getTotalByCategory: async () => {
    const result = await chargesAPI.getAll();
    const totals: Record<string, number> = {};
    result.summary.byType.forEach(item => {
      totals[item.type] = item.total;
    });
    return { success: true, data: totals };
  },
};

export const adsApi = {
  getAll: async () => {
    const result = await adsCostsAPI.getAll();
    // Transform API response to frontend AdCampaign type
    const transformedAds = (result.adsCosts as Array<{
      id: number;
      campaignName: string;
      platform: string;
      cost: string;
      results: number | null;
      costPerResult: string | null;
      campaignDate: string;
      notes: string | null;
      createdAt: string;
    }>).map(ad => ({
      id: String(ad.id),
      name: ad.campaignName,
      platform: (platformToFrontend[ad.platform] || 'Other') as 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'YouTube' | 'Other',
      cost: parseFloat(ad.cost),
      results: ad.results || 0,
      costPerResult: ad.costPerResult ? parseFloat(ad.costPerResult) : 0,
      startDate: new Date(ad.campaignDate),
      endDate: new Date(ad.campaignDate),
      status: 'ACTIVE' as const,
      createdAt: new Date(ad.createdAt),
    }));
    return {
      data: transformedAds,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
  create: async (data: { name: string; platform: string; cost: number; results: number; startDate: Date; endDate: Date; status: string }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await adsCostsAPI.create({
        campaignName: data.name,
        platform: platformToBackend[data.platform] || 'OTHER',
        cost: data.cost,
        results: data.results,
        campaignDate: data.startDate.toISOString().split('T')[0],
      });
      return { success: true, data: result.adsCost, message: 'Campaign created successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create campaign';
      return { success: false, error: message };
    }
  },
  update: async (id: string, data: Partial<{ name: string; platform: string; cost: number; results: number; startDate: Date; endDate: Date; status: string }>): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await adsCostsAPI.update(parseInt(id), {
        campaignName: data.name,
        platform: data.platform ? platformToBackend[data.platform] || 'OTHER' : undefined,
        cost: data.cost,
        results: data.results,
        campaignDate: data.startDate?.toISOString().split('T')[0],
      });
      return { success: true, data: result.adsCost, message: 'Campaign updated successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update campaign';
      return { success: false, error: message };
    }
  },
  delete: async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await adsCostsAPI.delete(parseInt(id));
      return { success: true, message: 'Campaign deleted successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete campaign';
      return { success: false, error: message };
    }
  },
};

export const adminsApi = {
  getAll: async () => {
    const result = await adminsAPI.getAll();
    // Transform API response to frontend AdminUser type
    const transformedAdmins = result.admins.map(admin => ({
      id: String(admin.id),
      name: admin.name || '',
      email: admin.email,
      role: admin.role as 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_AGENT' | 'WAREHOUSE_AGENT' | 'CONFIRMER',
      status: admin.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
      createdAt: new Date(admin.createdAt),
      lastLogin: undefined,
    }));
    return {
      data: transformedAdmins,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      totalPages: result.totalPages,
    };
  },
  create: async (data: { name: string; email: string; password: string; role?: string }): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await adminsAPI.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'ADMIN',
      });
      return { success: true, data: result.admin, message: 'User created successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      return { success: false, error: message };
    }
  },
  update: async (id: string, data: Partial<{ name: string; email: string; password: string; role: string }>): Promise<{ success: boolean; data?: unknown; message?: string; error?: string }> => {
    try {
      const result = await adminsAPI.update(parseInt(id), data);
      return { success: true, data: result.admin, message: 'User updated successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      return { success: false, error: message };
    }
  },
  toggleStatus: async (id: string): Promise<{ success: boolean; data?: { status: string }; message?: string; error?: string }> => {
    try {
      const admins = await adminsAPI.getAll();
      const admin = admins.admins.find(a => a.id === parseInt(id));
      if (!admin) return { success: false, error: 'Admin not found' };
      const newIsActive = !admin.isActive;
      await adminsAPI.update(parseInt(id), { isActive: newIsActive });
      return { success: true, data: { status: newIsActive ? 'ACTIVE' : 'INACTIVE' }, message: 'Admin status updated' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle admin status';
      return { success: false, error: message };
    }
  },
  delete: async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await adminsAPI.delete(parseInt(id));
      return { success: true, message: 'Admin deleted successfully' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete admin';
      return { success: false, error: message };
    }
  },
};

export const dashboardApi = {
  getStats: async () => {
    const result = await dashboardAPI.getStats();
    return {
      success: true,
      data: {
        totalRevenue: result.stats.totalRevenue,
        totalOrders: result.stats.totalOrders,
        productsCount: result.stats.totalProducts,
        lowStockItems: result.stats.lowStockCount,
        revenueChange: 0,
        ordersChange: 0,
      },
    };
  },
  getSalesData: async () => {
    const result = await dashboardAPI.getStats();
    return {
      success: true,
      data: result.charts.revenueByMonth.map(item => ({
        date: item.month,
        sales: item.revenue,
        orders: item.count,
      })),
    };
  },
  getTopProducts: async () => {
    const result = await dashboardAPI.getStats();
    return {
      success: true,
      data: result.charts.topProducts.map(item => ({
        productId: String(item.productId),
        productName: item.productName,
        totalSold: item.totalQuantity,
        revenue: item.totalRevenue,
      })),
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRecentOrders: async (limit?: number) => {
    const result = await dashboardAPI.getStats();
    // Transform to Order type format
    const transformedOrders = result.recentOrders.map(order => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      barcode: order.orderNumber,
      status: order.status as 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED',
      deliveryPrice: 0,
      subtotal: parseFloat(order.totalAmount),
      total: parseFloat(order.totalAmount),
      customerName: order.customerName,
      customerPhone: '',
      customerAddress: '',
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.createdAt),
      createdBy: '',
      items: [],
    }));
    return { success: true, data: transformedOrders };
  },
};
