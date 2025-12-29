import { NextResponse } from 'next/server';

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

export const ErrorMessages = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_REQUIRED: 'Authentication token is required',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',

  // Authorization errors
  FORBIDDEN: 'You do not have permission to perform this action',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this resource',

  // Resource errors
  NOT_FOUND: 'Resource not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  ORDER_NOT_FOUND: 'Order not found',
  USER_NOT_FOUND: 'User not found',
  STOCK_NOT_FOUND: 'Stock record not found',

  // Validation errors
  VALIDATION_ERROR: 'Validation error',
  INVALID_REQUEST: 'Invalid request data',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  DUPLICATE_ENTRY: 'A record with this value already exists',
  DUPLICATE_SKU: 'A product with this SKU already exists',
  DUPLICATE_BARCODE: 'A product with this barcode already exists',
  DUPLICATE_EMAIL: 'A user with this email already exists',
  DUPLICATE_ORDER_NUMBER: 'An order with this number already exists',

  // Business logic errors
  INSUFFICIENT_STOCK: 'Insufficient stock for this operation',
  CANNOT_DELETE_WITH_ORDERS: 'Cannot delete product with existing orders',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',

  // Server errors
  INTERNAL_ERROR: 'An internal server error occurred',
  DATABASE_ERROR: 'Database operation failed',
};

export function createErrorResponse(
  message: string,
  statusCode: number,
  details?: unknown
): NextResponse {
  const response: { error: string; details?: unknown } = { error: message };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status: statusCode });
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.statusCode, error.details);
  }

  if (error instanceof Error) {
    // Check for specific database errors
    if (error.message.includes('unique constraint')) {
      return createErrorResponse(ErrorMessages.DUPLICATE_ENTRY, 409);
    }

    if (error.message.includes('foreign key')) {
      return createErrorResponse('Related record not found', 400);
    }

    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse(ErrorMessages.INTERNAL_ERROR, 500);
}

// Convenience functions
export function badRequest(message: string = ErrorMessages.INVALID_REQUEST, details?: unknown): NextResponse {
  return createErrorResponse(message, 400, details);
}

export function unauthorized(message: string = ErrorMessages.TOKEN_REQUIRED): NextResponse {
  return createErrorResponse(message, 401);
}

export function forbidden(message: string = ErrorMessages.FORBIDDEN): NextResponse {
  return createErrorResponse(message, 403);
}

export function notFound(message: string = ErrorMessages.NOT_FOUND): NextResponse {
  return createErrorResponse(message, 404);
}

export function conflict(message: string = ErrorMessages.DUPLICATE_ENTRY): NextResponse {
  return createErrorResponse(message, 409);
}

export function internalError(message: string = ErrorMessages.INTERNAL_ERROR): NextResponse {
  return createErrorResponse(message, 500);
}
