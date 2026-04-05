// Individual supplier endpoint

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/suppliers/[id]
 * Get a single supplier
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const [supplier] = (await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))) as any[];

    if (!supplier) {
      return errorResponse('Supplier not found', 404);
    }

    return successResponse(supplier, 'Supplier fetched');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * PUT /api/suppliers/[id]
 * Update a supplier
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const body = await request.json();

    const [supplier] = (await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))) as any[];

    if (!supplier) {
      return errorResponse('Supplier not found', 404);
    }

    const result = await db
      .update(suppliers)
      .set({
        name: body.name || supplier.name,
        contactPerson: body.contactPerson ?? supplier.contactPerson,
        email: body.email ?? supplier.email,
        phone: body.phone ?? supplier.phone,
        fax: body.fax ?? supplier.fax,
        address: body.address ?? supplier.address,
        city: body.city ?? supplier.city,
        state: body.state ?? supplier.state,
        country: body.country ?? supplier.country,
        zipCode: body.zipCode ?? supplier.zipCode,
        paymentTerms: body.paymentTerms ?? supplier.paymentTerms,
        taxId: body.taxId ?? supplier.taxId,
        isActive: body.isActive ?? supplier.isActive,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    if (!result.length) {
      return errorResponse('Failed to update supplier', 500);
    }

    return successResponse(result[0], 'Supplier updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Delete a supplier (soft delete by marking inactive)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);

    const [supplier] = (await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))) as any[];

    if (!supplier) {
      return errorResponse('Supplier not found', 404);
    }

    // Soft delete by marking inactive
    const result = await db
      .update(suppliers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    return successResponse(result[0], 'Supplier deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
