// Appointments API

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { appointments, patients, notifications, auditLogs } from '@/db/schema';
import { eq, and, gte, lte, desc, like, or, sql, inArray } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/appointments
 * Get appointments with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_appointments');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(200, parseInt(searchParams.get('pageSize') || '50')));

    let whereConditions = [];
    if (doctorId) whereConditions.push(eq(appointments.doctorId, parseInt(doctorId)));
    if (patientId) whereConditions.push(eq(appointments.patientId, parseInt(patientId)));
    if (status) whereConditions.push(eq(appointments.status, status as any));
    if (fromDate) {
      whereConditions.push(gte(appointments.appointmentDate, new Date(fromDate)));
    }
    if (toDate) {
      whereConditions.push(lte(appointments.appointmentDate, new Date(toDate)));
    }

    // Search by patient name
    if (search) {
      const matchingPatients = await db
        .select({ id: patients.id })
        .from(patients)
        .where(
          or(
            like(patients.firstName, `%${search}%`),
            like(patients.lastName, `%${search}%`)
          )
        );
      const patientIds = matchingPatients.map((p) => p.id);
      if (patientIds.length > 0) {
        whereConditions.push(inArray(appointments.patientId, patientIds));
      } else {
        // No matching patients, return empty
        return successResponse({ data: [], pagination: { page, pageSize, total: 0, totalPages: 0 } });
      }
    }

    const appointmentList = await db.query.appointments.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: [desc(appointments.appointmentDate)],
      with: {
        patient: {
          columns: { id: true, firstName: true, lastName: true, phone: true },
        },
        doctor: {
          columns: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Get total count with same filters
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(whereClause);

    return successResponse(
      {
        data: appointmentList,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      'Appointments fetched successfully'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch appointments', 500);
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_appointment');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.patientId || !body.doctorId || !body.appointmentDate) {
      return errorResponse('Missing required fields', 400);
    }

    const result = await db
      .insert(appointments)
      .values({
        patientId: body.patientId,
        doctorId: body.doctorId,
        appointmentDate: new Date(body.appointmentDate),
        duration: body.duration || 30,
        status: 'pending',
        description: body.description || null,
        notes: body.notes || null,
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to create appointment', 500);
    }

    // Create notification for doctor
    await db.insert(notifications).values({
      userId: body.doctorId,
      type: 'appointment_confirmed',
      title: 'New Appointment Scheduled',
      message: `New appointment scheduled for ${new Date(body.appointmentDate).toLocaleDateString()}`,
      relatedEntityType: 'appointment',
      relatedEntityId: result[0].id,
    });

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'created',
      entityType: 'appointment',
      entityId: result[0].id,
      description: `Scheduled appointment for patient ${result[0].patientId}`,
    });

    return successResponse(result[0], 'Appointment created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create appointment', 500);
  }
}

/**
 * PUT /api/appointments/[id]
 * Update appointment
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'edit_appointment');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const id = request.nextUrl.pathname.split('/').pop() || '0';
    const body = await request.json();

    const result = await db
      .update(appointments)
      .set({
        status: body.status || undefined,
        description: body.description !== undefined ? body.description : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return errorResponse('Appointment not found', 404);
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'updated',
      entityType: 'appointment',
      entityId: parseInt(id),
      description: `Updated appointment status to ${body.status}`,
      changeData: body,
    });

    return successResponse(result[0], 'Appointment updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update appointment', 500);
  }
}
