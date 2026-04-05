// Individual stock item endpoint

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { stockItems, stockTransactions, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/stock/[id]
 * Get a single stock item
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const [stock] = (await db
      .select()
      .from(stockItems)
      .where(eq(stockItems.id, id))) as any[];

    if (!stock) {
      return errorResponse('Stock item not found', 404);
    }

    return successResponse(stock, 'Stock item fetched');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * PUT /api/stock/[id]
 * Update stock quantity (usage, return, adjustment, waste)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const body = await request.json();

    // Get current stock
    const [currentStock] = (await db
      .select()
      .from(stockItems)
      .where(eq(stockItems.id, id))) as any[];

    if (!currentStock) {
      return errorResponse('Stock item not found', 404);
    }

    const previousQuantity = currentStock.quantity;
    const newQuantity = currentStock.quantity + (body.quantityChange || 0);

    if (newQuantity < 0) {
      return errorResponse('Insufficient stock', 400);
    }

    // Update stock
    const result = await db
      .update(stockItems)
      .set({
        quantity: newQuantity,
        updatedAt: new Date(),
      })
      .where(eq(stockItems.id, id))
      .returning();

    // Log transaction
    await db.insert(stockTransactions).values({
      stockItemId: id,
      transactionType: body.type || 'usage',
      quantity: Math.abs(body.quantityChange || 0),
      previousQuantity,
      newQuantity,
      reason: body.reason || null,
      referenceId: body.referenceId || null,
      performedByUserId: currentUser.id,
    });

    // Check if stock is low and send alert
    if (newQuantity <= currentStock.minStockLevel) {
      // Find users with stock management permission
      // TODO: Implement notification for low stock alert
      /*
      const doctors = await db.query.users.findMany({
        where: eq(users.role, 'doctor'),
      });

      for (const doctor of doctors) {
        await db.insert(notifications).values({
          userId: doctor.id,
          type: 'stock_low',
          title: 'Low Stock Alert',
          message: `Stock for ${currentStock.itemName} is below minimum level`,
          relatedEntityType: 'stock_item',
          relatedEntityId: id,
        });
      }
      */
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'updated',
      entityType: 'stock_item',
      entityId: id,
      description: `${body.type || 'Usage'} stock: ${currentStock.itemName}. Changed from ${previousQuantity} to ${newQuantity}`,
      changeData: body,
    });

    return successResponse(result[0], 'Stock updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/stock/[id]
 * Delete a stock item
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    // Get stock item
    const [stock] = (await db
      .select()
      .from(stockItems)
      .where(eq(stockItems.id, id))) as any[];

    if (!stock) {
      return errorResponse('Stock item not found', 404);
    }

    // Delete stock item
    await db.delete(stockItems).where(eq(stockItems.id, id));

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'deleted',
      entityType: 'stock_item',
      entityId: id,
      description: `Deleted stock item: ${stock.itemName}`,
    });

    return successResponse(null, 'Stock item deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
