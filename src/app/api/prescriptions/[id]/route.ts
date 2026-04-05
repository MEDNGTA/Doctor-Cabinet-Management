import { NextRequest } from 'next/server';
import { db } from '@/db';
import { prescriptions, prescriptionDetails, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'view_prescriptions');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const prescription = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, parseInt(id)),
      with: {
        patient: { columns: { id: true, firstName: true, lastName: true } },
        doctor: { columns: { id: true, firstName: true, lastName: true } },
        details: true,
      },
    });

    if (!prescription) return errorResponse('Prescription not found', 404);
    return successResponse(prescription);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch prescription', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'edit_prescription');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const prescriptionId = parseInt(id);
    const body = await request.json();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const result = await db
      .update(prescriptions)
      .set(updateData)
      .where(eq(prescriptions.id, prescriptionId))
      .returning();

    if (!result.length) return errorResponse('Prescription not found', 404);

    // If medications are provided, replace them
    if (body.medications && body.medications.length > 0) {
      await db.delete(prescriptionDetails).where(eq(prescriptionDetails.prescriptionId, prescriptionId));
      await db.insert(prescriptionDetails).values(
        body.medications.map((med: any) => ({
          prescriptionId,
          medicationName: med.medicationName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || null,
        }))
      );
    }

    const currentUser = session.user as any;
    await db.insert(auditLogs).values({
      userId: parseInt(currentUser.id),
      action: 'updated',
      entityType: 'prescription',
      entityId: prescriptionId,
      description: `Updated prescription ${prescriptionId}`,
    });

    return successResponse(result[0], 'Prescription updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update prescription', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(request, 'delete_prescription');
    if (!session) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const prescriptionId = parseInt(id);

    const existing = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, prescriptionId),
    });
    if (!existing) return errorResponse('Prescription not found', 404);

    await db.delete(prescriptions).where(eq(prescriptions.id, prescriptionId));

    const currentUser = session.user as any;
    await db.insert(auditLogs).values({
      userId: parseInt(currentUser.id),
      action: 'deleted',
      entityType: 'prescription',
      entityId: prescriptionId,
      description: `Deleted prescription ${prescriptionId}`,
    });

    return successResponse(null, 'Prescription deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete prescription', 500);
  }
}
