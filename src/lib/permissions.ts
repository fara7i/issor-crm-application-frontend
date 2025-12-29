export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_AGENT' | 'WAREHOUSE_AGENT' | 'CONFIRMER';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  CONFIRMER: 1,
  SHOP_AGENT: 2,
  WAREHOUSE_AGENT: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

// Route permission mapping
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Auth routes - public
  '/api/auth/login': [],
  '/api/auth/me': ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT', 'CONFIRMER'],

  // Products routes
  '/api/products': ['SUPER_ADMIN', 'ADMIN'],
  '/api/products/import-csv': ['SUPER_ADMIN', 'ADMIN'],

  // Stock routes
  '/api/stock': ['SUPER_ADMIN', 'ADMIN'],
  '/api/stock/add': ['SUPER_ADMIN', 'ADMIN'],
  '/api/stock/remove': ['SUPER_ADMIN', 'ADMIN'],
  '/api/stock/history': ['SUPER_ADMIN', 'ADMIN'],

  // Orders routes - different permissions
  '/api/orders': ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT'],
  '/api/orders/stats': ['SUPER_ADMIN', 'ADMIN'],

  // Scan orders routes
  '/api/scan-orders': ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'],

  // Salaries routes
  '/api/salaries': ['SUPER_ADMIN', 'ADMIN'],

  // Charges routes
  '/api/charges': ['SUPER_ADMIN', 'ADMIN'],

  // Ads costs routes
  '/api/ads-costs': ['SUPER_ADMIN', 'ADMIN'],

  // Admin management routes - SUPER_ADMIN only
  '/api/admins': ['SUPER_ADMIN'],

  // Dashboard routes
  '/api/dashboard/stats': ['SUPER_ADMIN', 'ADMIN'],

  // Digylog integration routes
  '/api/digylog/payments': ['SUPER_ADMIN', 'ADMIN'],
  '/api/digylog/users': ['SUPER_ADMIN', 'ADMIN'],
  '/api/digylog/pickup-requests': ['SUPER_ADMIN', 'ADMIN'],
};

/**
 * Check if user has permission to access a route
 */
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  // If no roles required, it's a public route
  if (requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.includes(userRole);
}

/**
 * Check if user has at least the specified role level
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Get permission for a route path
 */
export function getRoutePermissions(path: string): UserRole[] {
  // Check exact match first
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path];
  }

  // Check for dynamic routes (e.g., /api/products/[id])
  const basePath = path.replace(/\/\d+$/, '');
  if (ROUTE_PERMISSIONS[basePath]) {
    return ROUTE_PERMISSIONS[basePath];
  }

  // Check for nested dynamic routes
  const pathParts = path.split('/');
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const testPath = pathParts.slice(0, i + 1).join('/');
    if (ROUTE_PERMISSIONS[testPath]) {
      return ROUTE_PERMISSIONS[testPath];
    }
  }

  // Default: require SUPER_ADMIN for unknown routes
  return ['SUPER_ADMIN'];
}

/**
 * Check if user can perform action on resource
 */
export const RESOURCE_PERMISSIONS = {
  products: {
    create: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT'] as UserRole[],
    update: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    delete: ['SUPER_ADMIN'] as UserRole[],
  },
  orders: {
    create: ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT'] as UserRole[],
    update: ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'] as UserRole[],
    delete: ['SUPER_ADMIN'] as UserRole[],
  },
  stock: {
    create: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    update: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    delete: ['SUPER_ADMIN'] as UserRole[],
  },
  salaries: {
    create: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    update: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    delete: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
  },
  charges: {
    create: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    update: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    delete: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
  },
  adsCosts: {
    create: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    update: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
    delete: ['SUPER_ADMIN', 'ADMIN'] as UserRole[],
  },
  admins: {
    create: ['SUPER_ADMIN'] as UserRole[],
    read: ['SUPER_ADMIN'] as UserRole[],
    update: ['SUPER_ADMIN'] as UserRole[],
    delete: ['SUPER_ADMIN'] as UserRole[],
  },
  scanOrders: {
    create: ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'] as UserRole[],
    read: ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'] as UserRole[],
  },
};

export function canPerformAction(
  userRole: UserRole,
  resource: keyof typeof RESOURCE_PERMISSIONS,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = RESOURCE_PERMISSIONS[resource];
  if (!permissions) {
    return false;
  }
  const allowedRoles = (permissions as Record<string, UserRole[]>)[action];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(userRole);
}
