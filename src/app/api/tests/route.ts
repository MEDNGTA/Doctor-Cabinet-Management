// Tests Management API

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { tests, notifications, auditLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/tests
 * Get tests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_test_results');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const testList = await db.query.tests.findMany({
      where: patientId ? eq(tests.patientId, parseInt(patientId)) : undefined,
      orderBy: [desc(tests.createdAt)],
      with: {
        template: true,
        patient: { columns: { firstName: true, lastName: true } },
        doctor: { columns: { firstName: true, lastName: true } },
        performedBy: { columns: { firstName: true, lastName: true } },
      },
    });

    return successResponse(testList, 'Tests fetched');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/tests
 * Create test
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_test');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.testTemplateId || !body.patientId || !body.doctorId) {
      return errorResponse('Missing required fields', 400);
    }

    const result = await db
      .insert(tests)
      .values({
        testTemplateId: body.testTemplateId,
        appointmentId: body.appointmentId || null,
        visitSessionId: body.visitSessionId || null,
        patientId: body.patientId,
        doctorId: body.doctorId,
        assignedNurseId: body.assignedNurseId || null,
        status: 'pending',
        notes: body.notes || null,
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to create test', 500);
    }

    // Notify assigned nurse if applicable
    if (body.assignedNurseId) {
      await db.insert(notifications).values({
        userId: body.assignedNurseId,
        type: 'appointment_confirmed',
        title: 'Test Assigned',
        message: 'A new test has been assigned to you',
        relatedEntityType: 'test',
        relatedEntityId: result[0].id,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'created',
      entityType: 'test',
      entityId: result[0].id,
      description: `Created test for patient ${result[0].patientId}`,
    });

    return successResponse(result[0], 'Test created', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * PUT /api/tests/[id]
 * Update test (perform test, add results)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'perform_test');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');
    const body = await request.json();

    const result = await db
      .update(tests)
      .set({
        status: body.status || undefined,
        result: body.result !== undefined ? body.result : undefined,
        resultValue: body.resultValue !== undefined ? body.resultValue : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        performedAt: body.performedAt ? new Date(body.performedAt) : undefined,
        performedByUserId: body.performedAt ? currentUser.id : undefined,
        reportUrl: body.reportUrl !== undefined ? body.reportUrl : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tests.id, id))
      .returning();

    if (!result.length) {
      return errorResponse('Test not found', 404);
    }

    // Notify relevant parties if test is completed
    if (body.status === 'completed') {
      const test = result[0];
      await db.insert(notifications).values({
        userId: test.doctorId,
        type: 'test_completed',
        title: 'Test Completed',
        message: 'A test result is ready for review',
        relatedEntityType: 'test',
        relatedEntityId: id,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'updated',
      entityType: 'test',
      entityId: id,
      description: `Updated test status to ${body.status}`,
      changeData: body,
    });

    return successResponse(result[0], 'Test updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
