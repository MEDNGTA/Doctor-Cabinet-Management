// Restock orders management endpoint

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { restockOrders } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/stock/restock-orders
 * Get restock orders with filtering
 * Query params:
 * - status: Filter by status (pending, received, cancelled)
 * - supplierId: Filter by supplier
 * - limit: Number of results
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');

    const whereConditions = [];
    if (status) whereConditions.push(eq(restockOrders.status, status));
    if (supplierId) whereConditions.push(eq(restockOrders.supplierId, parseInt(supplierId)));
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const orders = await db.query.restockOrders.findMany({
      where: whereClause,
      orderBy: [desc(restockOrders.orderDate)],
      with: {
        stockItem: { columns: { itemName: true, id: true } },
        supplier: { columns: { name: true, contactPerson: true, phone: true } },
        orderedBy: { columns: { firstName: true, lastName: true } },
      },
      limit: 100,
    });

    return successResponse(orders, 'Restock orders fetched');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
/**
 * POST /api/stock/restock-orders
 * Create a new restock order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.stockItemId || !body.supplierId || !body.quantity || !body.unitPrice) {
      return errorResponse('Missing required fields', 400);
    }

    const result = await db
      .insert(restockOrders)
      .values({
        stockItemId: body.stockItemId,
        supplierId: body.supplierId,
        quantity: body.quantity,
        unitPrice: body.unitPrice.toString(),
        totalPrice: (body.quantity * body.unitPrice).toString(),
        expectedDeliveryDate: body.expectedDeliveryDate
          ? new Date(body.expectedDeliveryDate)
          : null,
        orderNotes: body.orderNotes || null,
        orderedByUserId: currentUser.id,
        status: 'pending',
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to create restock order', 500);
    }

    return successResponse(result[0], 'Restock order created', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
