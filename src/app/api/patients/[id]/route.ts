import { NextRequest } from 'next/server';
import { db } from '@/db';
import { patients, auditLogs } from '@/db/schema';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'view_patients');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, parseInt(id)),
    });

    if (!patient) return errorResponse('Patient not found', 404);
    return successResponse(patient);
  } catch (error: any) {
    console.error('Get patient error:', error);
    return errorResponse(error.message || 'Failed to fetch patient', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'edit_patient');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const patientId = parseInt(id);
    const body = await request.json();

    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'gender', 'address', 'city', 'country', 'medicalHistory',
      'allergies', 'insuranceNumber', 'insuranceProvider',
      'emergencyContactName', 'emergencyContactPhone', 'notes', 'status',
    ];
    const sanitized: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) sanitized[key] = body[key];
    }

    const updatedPatient = await db
      .update(patients)
      .set({ ...sanitized, updatedAt: new Date() })
      .where(eq(patients.id, patientId))
      .returning();

    if (updatedPatient.length === 0) return errorResponse('Patient not found', 404);

    const currentUser = session.user as any;
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'updated',
      entityType: 'patient',
      entityId: patientId,
      description: `Updated patient: ${updatedPatient[0].firstName} ${updatedPatient[0].lastName}`,
    });

    return successResponse(updatedPatient[0], 'Patient updated successfully');
  } catch (error: any) {
    console.error('Update patient error:', error);
    return errorResponse(error.message || 'Failed to update patient', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'delete_patient');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const patientId = parseInt(id);

    const existing = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    });
    if (!existing) return errorResponse('Patient not found', 404);

    await db.delete(patients).where(eq(patients.id, patientId));

    const currentUser = session.user as any;
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'deleted',
      entityType: 'patient',
      entityId: patientId,
      description: `Deleted patient: ${existing.firstName} ${existing.lastName}`,
    });

    return successResponse(null, 'Patient deleted successfully');
  } catch (error: any) {
    console.error('Delete patient error:', error);
    return errorResponse(error.message || 'Failed to delete patient', 500);
  }
}
