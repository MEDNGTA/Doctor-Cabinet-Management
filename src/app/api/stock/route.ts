// Stock Management API with usage tracking and alerts

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { stockItems, stockTransactions, auditLogs } from '@/db/schema';
import { eq, desc, lte, sql, and } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/stock
 * Get stock items with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(200, parseInt(searchParams.get('pageSize') || '50')));

    const whereConditions = [];
    if (category) whereConditions.push(eq(stockItems.category, category));
    if (lowStockOnly) whereConditions.push(lte(stockItems.quantity, stockItems.minStockLevel));

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const stockList = await db.query.stockItems.findMany({
      where: whereClause,
      with: {
        supplier: { columns: { name: true, contactPerson: true, phone: true } },
      },
      orderBy: [desc(stockItems.updatedAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockItems)
      .where(whereClause);

    return successResponse(
      {
        data: stockList,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
      'Stock items fetched'
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/stock
 * Create new stock item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.itemName || !body.category || !body.unit || body.unitPrice === undefined) {
      return errorResponse('Missing required fields', 400);
    }

    const result = await db
      .insert(stockItems)
      .values({
        itemName: body.itemName,
        description: body.description || null,
        category: body.category,
        quantity: body.initialQuantity || 0,
        unit: body.unit,
        minStockLevel: body.minStockLevel || 10,
        maxStockLevel: body.maxStockLevel || null,
        unitPrice: body.unitPrice.toString(),
        supplierId: body.supplierId || null,
        reorderPoint: body.reorderPoint || 10,
        createdByUserId: currentUser.id,
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to create stock item', 500);
    }

    // Log initial transaction
    if (body.initialQuantity && body.initialQuantity > 0) {
      await db.insert(stockTransactions).values({
        stockItemId: result[0].id,
        transactionType: 'purchase',
        quantity: body.initialQuantity,
        previousQuantity: 0,
        newQuantity: body.initialQuantity,
        reason: 'Initial stock entry',
        performedByUserId: currentUser.id,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'created',
      entityType: 'stock_item',
      entityId: result[0].id,
      description: `Created stock item: ${body.itemName}`,
    });

    return successResponse(result[0], 'Stock item created', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}


