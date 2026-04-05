import { NextRequest } from 'next/server';
import { db } from '@/db';
import { prescriptions, prescriptionDetails, auditLogs } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_prescriptions');
    if (!session) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20')));

    let whereConditions = [];
    if (patientId) whereConditions.push(eq(prescriptions.patientId, parseInt(patientId)));
    if (status) whereConditions.push(eq(prescriptions.status, status as any));

    const prescriptionList = await db.query.prescriptions.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: [desc(prescriptions.createdAt)],
      with: {
        patient: { columns: { id: true, firstName: true, lastName: true } },
        doctor: { columns: { id: true, firstName: true, lastName: true } },
        details: true,
      },
    });

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prescriptions)
      .where(whereClause);

    return successResponse({ data: prescriptionList, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch prescriptions', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_prescription');
    if (!session) return errorResponse('Unauthorized', 403);

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.patientId || !body.medications || body.medications.length === 0) {
      return errorResponse('Patient and at least one medication are required', 400);
    }

    // Create prescription
    const [prescription] = await db
      .insert(prescriptions)
      .values({
        patientId: body.patientId,
        doctorId: parseInt(currentUser.id),
        appointmentId: body.appointmentId || null,
        visitSessionId: body.visitSessionId || null,
        prescriptionDate: new Date(),
        status: 'draft',
        notes: body.notes || null,
      })
      .returning();

    // Insert medication details
    if (body.medications && body.medications.length > 0) {
      await db.insert(prescriptionDetails).values(
        body.medications.map((med: any) => ({
          prescriptionId: prescription.id,
          medicationName: med.medicationName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || null,
        }))
      );
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: parseInt(currentUser.id),
      action: 'created',
      entityType: 'prescription',
      entityId: prescription.id,
      description: `Created prescription for patient ${body.patientId}`,
    });

    return successResponse(prescription, 'Prescription created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create prescription', 500);
  }
}
