import { NextRequest } from 'next/server';
import { db } from '@/db';
import { appointments, auditLogs } from '@/db/schema';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'view_appointments');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, parseInt(id)),
      with: {
        patient: { columns: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { columns: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!appointment) return errorResponse('Appointment not found', 404);
    return successResponse(appointment);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch appointment', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'edit_appointment');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const appointmentId = parseInt(id);
    const body = await request.json();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.status) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.appointmentDate) updateData.appointmentDate = new Date(body.appointmentDate);
    if (body.duration) updateData.duration = body.duration;

    const result = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    if (!result.length) return errorResponse('Appointment not found', 404);

    const currentUser = session.user as any;
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'updated',
      entityType: 'appointment',
      entityId: appointmentId,
      description: `Updated appointment ${appointmentId}`,
      changeData: body,
    });

    return successResponse(result[0], 'Appointment updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update appointment', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'delete_appointment');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const appointmentId = parseInt(id);

    // Soft delete: set status to cancelled
    const result = await db
      .update(appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(appointments.id, appointmentId))
      .returning();

    if (!result.length) return errorResponse('Appointment not found', 404);

    const currentUser = session.user as any;
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'cancelled',
      entityType: 'appointment',
      entityId: appointmentId,
      description: `Cancelled appointment ${appointmentId}`,
    });

    return successResponse(null, 'Appointment cancelled successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to cancel appointment', 500);
  }
}
