// Suppliers management endpoint

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/suppliers
 * Get all suppliers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const suppliersList = await db.query.suppliers.findMany({
      where: eq(suppliers.isActive, true),
      orderBy: [],
    });

    return successResponse(suppliersList, 'Suppliers fetched');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const body = await request.json();

    if (!body.name) {
      return errorResponse('Supplier name is required', 400);
    }

    const result = await db
      .insert(suppliers)
      .values({
        name: body.name,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        fax: body.fax || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        zipCode: body.zipCode || null,
        paymentTerms: body.paymentTerms || null,
        taxId: body.taxId || null,
        isActive: true,
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to create supplier', 500);
    }

    return successResponse(result[0], 'Supplier created', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
