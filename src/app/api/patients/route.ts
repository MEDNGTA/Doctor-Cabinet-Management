// Comprehensive patient management API with role-based permissions

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { patients, auditLogs } from '@/db/schema';
import { like, or, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_patients');
    if (!session) {
      return errorResponse('Unauthorized', 403, 'You do not have permission to view patients');
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10')));
    const offset = (page - 1) * pageSize;

    // Build query with optional search
    let query = db.query.patients.findMany({
      limit: pageSize,
      offset,
      orderBy: [desc(patients.createdAt)],
      with: {
        createdByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const patientList = search
      ? await db
          .select()
          .from(patients)
          .where(
            or(
              like(patients.firstName, `%${search}%`),
              like(patients.lastName, `%${search}%`),
              like(patients.phone, `%${search}%`),
              like(patients.email || '', `%${search}%`)
            )
          )
          .limit(pageSize)
          .offset(offset)
      : await query;

    // Get total count with same filter
    const searchWhere = search
      ? or(
          like(patients.firstName, `%${search}%`),
          like(patients.lastName, `%${search}%`),
          like(patients.phone, `%${search}%`),
          like(patients.email || '', `%${search}%`)
        )
      : undefined;

    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .where(searchWhere);

    return successResponse(
      {
        data: patientList,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      'Patients fetched successfully'
    );
  } catch (error: any) {
    console.error('Get patients error:', error);
    return errorResponse(error.message || 'Failed to fetch patients', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_patient');
    if (!session) {
      return errorResponse('Unauthorized', 403, 'You do not have permission to create patients');
    }

    const currentUser = session.user as any;
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.phone) {
      return errorResponse(
        'Validation failed',
        400,
        'firstName, lastName, and phone are required'
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      age,
      address,
      city,
      country,
      medicalHistory,
      allergies,
      insuranceNumber,
      insuranceProvider,
      insuranceExpiry,
      emergencyContactName,
      emergencyContactPhone,
      notes,
    } = body;

    // Create new patient
    const result = await db
      .insert(patients)
      .values({
        firstName,
        lastName,
        email: email || null,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
        gender: gender || null,
        age: age || null,
        address: address || null,
        city: city || null,
        country: country || null,
        medicalHistory: medicalHistory || null,
        allergies: allergies || null,
        insuranceNumber: insuranceNumber || null,
        insuranceProvider: insuranceProvider || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry).toISOString().split('T')[0] : null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        notes: notes || null,
        createdByUserId: currentUser.id,
      })
      .returning();

    if (!result || result.length === 0) {
      return errorResponse('Failed to create patient', 500);
    }

    // Log audit
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'created',
      entityType: 'patient',
      entityId: result[0].id,
      description: `Created patient: ${firstName} ${lastName}`,
    });

    return successResponse(result[0], 'Patient created successfully', 201);
  } catch (error: any) {
    console.error('Create patient error:', error);
    return errorResponse(error.message || 'Failed to create patient', 500);
  }
}
