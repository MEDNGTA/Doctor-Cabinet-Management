// Notifications API

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || typeof session === 'object' && !('user' in session)) {
      return errorResponse('Unauthorized', 401);
    }

    const currentUser = (session as any).user as any;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(50, parseInt(searchParams.get('pageSize') || '10')));

    let whereConditions = [eq(notifications.userId, currentUser.id)];
    if (unreadOnly) {
      whereConditions.push(eq(notifications.isRead, false));
    }

    const notificationList = await db.query.notifications.findMany({
      where: and(...whereConditions),
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: [desc(notifications.createdAt)],
    });

    return successResponse(
      {
        data: notificationList,
        pagination: { page, pageSize, total: notificationList.length },
      },
      'Notifications fetched'
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * PUT /api/notifications/[id]
 * Mark notification as read
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');
    const body = await request.json();

    const result = await db
      .update(notifications)
      .set({
        isRead: body.isRead !== undefined ? body.isRead : true,
        readAt: body.isRead ? new Date() : null,
      })
      .where(eq(notifications.id, id))
      .returning();

    if (!result.length) {
      return errorResponse('Notification not found', 404);
    }

    return successResponse(result[0], 'Notification updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read (integrated into POST handler)
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || typeof session === 'object' && !('user' in session)) {
      return errorResponse('Unauthorized', 401);
    }

    const currentUser = (session as any).user as any;

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, currentUser.id), eq(notifications.isRead, false)));

    return successResponse({ success: true }, 'All notifications marked as read');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/notifications/[id]
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');

    await db.delete(notifications).where(eq(notifications.id, id));

    return successResponse({ success: true }, 'Notification deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
