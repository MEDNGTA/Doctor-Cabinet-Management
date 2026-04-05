// Invoices API - Complex billing and approval workflow

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceLineItems, auditLogs, notifications } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse, generateInvoiceNumber, calculateInvoiceTotals } from '@/lib/api-utils';

/**
 * GET /api/invoices
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_prescriptions');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10')));

    let whereConditions = [];
    if (patientId) whereConditions.push(eq(invoices.patientId, parseInt(patientId)));
    if (status) whereConditions.push(eq(invoices.status, status as any));

    const invoiceList = await db.query.invoices.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: [desc(invoices.createdAt)],
      with: {
        patient: { columns: { firstName: true, lastName: true } },
        lineItems: true,
      },
    });

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(whereClause);

    return successResponse(
      {
        data: invoiceList,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
      'Invoices fetched'
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/invoices
 * Create invoice
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_invoice');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.patientId || !body.lineItems || body.lineItems.length === 0) {
      return errorResponse('Missing required fields', 400);
    }

    // Calculate totals
    const subtotal = body.lineItems.reduce((acc: number, item: any) => {
      return acc + (item.unitPrice * item.quantity);
    }, 0);

    const totals = calculateInvoiceTotals(subtotal, body.taxRate || 0.1, body.discount || 0);

    // Create invoice
    const invoiceNumber = generateInvoiceNumber();
    const result = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        patientId: body.patientId,
        appointmentId: body.appointmentId || null,
        visitSessionId: body.visitSessionId || null,
        createdByUserId: currentUser.id,
        status: 'draft',
        subtotal: totals.subtotal.toString(),
        tax: totals.tax.toString(),
        discount: totals.discount.toString(),
        total: totals.total.toString(),
        paymentMethod: body.paymentMethod || null,
        notes: body.notes || null,
        dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to create invoice', 500);
    }

    // Add line items
    const lineItemsData = body.lineItems.map((item: any) => ({
      invoiceId: result[0].id,
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.unitPrice * (item.quantity || 1)).toString(),
      testId: item.testId || null,
    }));

    await db.insert(invoiceLineItems).values(lineItemsData);

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'created',
      entityType: 'invoice',
      entityId: result[0].id,
      description: `Created invoice ${invoiceNumber}`,
    });

    return successResponse(result[0], 'Invoice created', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * PUT /api/invoices/[id]
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'edit_invoice');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');
    const body = await request.json();

    const result = await db
      .update(invoices)
      .set({
        status: body.status || undefined,
        paymentMethod: body.paymentMethod || undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    if (!result.length) {
      return errorResponse('Invoice not found', 404);
    }

    return successResponse(result[0], 'Invoice updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/invoices/[id]/approve
 * Doctor approval of invoice
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'approve_invoice');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const id = parseInt(request.nextUrl.pathname.split('/').filter(x => x)[3] || '0');
    const body = await request.json();

    if (body.action === 'approve') {
      const result = await db
        .update(invoices)
        .set({
          status: 'approved',
          approvedByDoctorId: currentUser.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id))
        .returning();

      if (!result.length) {
        return errorResponse('Invoice not found', 404);
      }

      // Notify secretariat
      await db.insert(notifications).values({
        userId: result[0].createdByUserId,
        type: 'invoice_ready',
        title: 'Invoice Approved',
        message: `Invoice ${result[0].invoiceNumber} has been approved`,
        relatedEntityType: 'invoice',
        relatedEntityId: id,
      });

      return successResponse(result[0], 'Invoice approved');
    } else if (body.action === 'reject') {
      const result = await db
        .update(invoices)
        .set({
          status: 'rejected',
          rejectionReason: body.reason || null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id))
        .returning();

      return successResponse(result[0], 'Invoice rejected');
    }

    return errorResponse('Invalid action', 400);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
