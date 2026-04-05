// Stock transaction history endpoint

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { stockTransactions } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/stock/transactions
 * Get stock transaction history
 * Query params:
 * - stockItemId: Filter by specific stock item
 * - type: Filter by transaction type (purchase, usage, return, adjustment, waste)
 * - limit: Number of results (default 100)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_stock');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const stockItemId = searchParams.get('stockItemId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.query.stockTransactions.findMany({
      where: stockItemId
        ? eq(stockTransactions.stockItemId, parseInt(stockItemId))
        : undefined,
      orderBy: [desc(stockTransactions.createdAt)],
      with: {
        performedBy: { columns: { firstName: true, lastName: true, id: true } },
        stockItem: { columns: { itemName: true, id: true } },
      },
      limit,
      offset,
    });

    const transactions = await query;

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockTransactions)
      .where(
        stockItemId
          ? eq(stockTransactions.stockItemId, parseInt(stockItemId))
          : undefined
      );

    return successResponse(
      {
        data: transactions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
      'Transactions fetched'
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
