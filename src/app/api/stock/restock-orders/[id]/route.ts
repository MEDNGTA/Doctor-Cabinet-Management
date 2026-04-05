// Individual restock order endpoint

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { restockOrders, stockItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/stock/restock-orders/[id]
 * Get a single restock order
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const [order] = (await db
      .select()
      .from(restockOrders)
      .where(eq(restockOrders.id, id))) as any[];

    if (!order) {
      return errorResponse('Restock order not found', 404);
    }

    return successResponse(order, 'Restock order fetched');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * PUT /api/stock/restock-orders/[id]
 * Update restock order status or delivery date
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

    const [order] = (await db
      .select()
      .from(restockOrders)
      .where(eq(restockOrders.id, id))) as any[];

    if (!order) {
      return errorResponse('Restock order not found', 404);
    }

    // If marking as received, update stock quantity
    if (body.status === 'received' && order.status !== 'received') {
      const [stock] = (await db
        .select()
        .from(stockItems)
        .where(eq(stockItems.id, order.stockItemId))) as any[];

      if (stock) {
        await db
          .update(stockItems)
          .set({
            quantity: stock.quantity + order.quantity,
            lastRestockDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(stockItems.id, order.stockItemId));
      }
    }

    const result = await db
      .update(restockOrders)
      .set({
        status: body.status || order.status,
        actualDeliveryDate:
          body.actualDeliveryDate && body.status === 'received'
            ? new Date(body.actualDeliveryDate)
            : order.actualDeliveryDate,
        updatedAt: new Date(),
      })
      .where(eq(restockOrders.id, id))
      .returning();

    return successResponse(result[0], 'Restock order updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/stock/restock-orders/[id]
 * Delete a restock order (only if pending)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);

    const [order] = (await db
      .select()
      .from(restockOrders)
      .where(eq(restockOrders.id, id))) as any[];

    if (!order) {
      return errorResponse('Restock order not found', 404);
    }

    if (order.status !== 'pending') {
      return errorResponse(
        'Can only delete pending restock orders',
        400
      );
    }

    await db.delete(restockOrders).where(eq(restockOrders.id, id));

    return successResponse(null, 'Restock order deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
