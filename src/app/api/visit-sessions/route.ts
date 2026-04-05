// Visit Sessions API - Dynamic patient visit sessions

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { visitSessions, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/visit-sessions
 * Get visit sessions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_sessions');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');
    const patientId = searchParams.get('patientId');

    const sessionList = await db.query.visitSessions.findMany({
      where: appointmentId
        ? eq(visitSessions.appointmentId, parseInt(appointmentId))
        : patientId
        ? eq(visitSessions.patientId, parseInt(patientId))
        : undefined,
      with: {
        appointment: true,
        patient: { columns: { firstName: true, lastName: true } },
        doctor: { columns: { firstName: true, lastName: true } },
      },
    });

    return successResponse(sessionList, 'Sessions fetched');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch sessions', 500);
  }
}

/**
 * POST /api/visit-sessions
 * Create a new visit session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_session');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.appointmentId || !body.sessionName || !body.sessionType) {
      return errorResponse('Missing required fields', 400);
    }

    const result = await db
      .insert(visitSessions)
      .values({
        appointmentId: body.appointmentId,
        patientId: body.patientId,
        doctorId: body.doctorId,
        sessionName: body.sessionName,
        sessionType: body.sessionType,
        description: body.description || null,
        notes: body.notes || null,
        status: 'active',
      })
      .returning();

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'created',
      entityType: 'visit_session',
      entityId: result[0].id,
      description: `Created visit session: ${body.sessionName}`,
    });

    return successResponse(result[0], 'Session created', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create session', 500);
  }
}

/**
 * PUT /api/visit-sessions/[id]
 * Update visit session
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'edit_session');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');
    const body = await request.json();

    const result = await db
      .update(visitSessions)
      .set({
        sessionName: body.sessionName || undefined,
        description: body.description !== undefined ? body.description : undefined,
        status: body.status || undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(visitSessions.id, id))
      .returning();

    if (!result.length) {
      return errorResponse('Session not found', 404);
    }

    return successResponse(result[0], 'Session updated');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update session', 500);
  }
}
