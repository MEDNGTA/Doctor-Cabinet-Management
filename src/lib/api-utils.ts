// API Response and utility functions for handling HTTP responses and errors

import { NextResponse } from 'next/server';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || 'Operation successful',
      statusCode,
    },
    { status: statusCode }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  statusCode: number = 400,
  message?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      message: message || error,
      statusCode,
    },
    { status: statusCode }
  );
}

/**
 * Handle common validation errors
 */
export class ValidationError extends Error {
  public statusCode = 400;
  public fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Handle authorization errors
 */
export class AuthorizationError extends Error {
  public statusCode = 403;

  constructor(message: string = 'You do not have permission to perform this action') {
    super(message);
  }
}

/**
 * Handle not found errors
 */
export class NotFoundError extends Error {
  public statusCode = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
  }
}

/**
 * Handle internal server errors
 */
export class InternalServerError extends Error {
  public statusCode = 500;

  constructor(message: string = 'Internal server error') {
    super(message);
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}

/**
 * Paginate array or query results
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = items.slice(start, end);

  return {
    data: paginatedItems,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
    },
  };
}

/**
 * Format decimal prices
 */
export function formatPrice(price: string | number | undefined): string {
  if (!price) return '0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toFixed(2);
}

/**
 * Calculate invoice totals
 */
export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export function calculateInvoiceTotals(
  subtotal: number,
  taxRate: number = 0.1,
  discount: number = 0
): InvoiceTotals {
  const tax = subtotal * taxRate;
  const total = subtotal + tax - discount;

  return {
    subtotal,
    tax,
    discount,
    total: Math.max(0, total),
  };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}${day}-${random}`;
}
