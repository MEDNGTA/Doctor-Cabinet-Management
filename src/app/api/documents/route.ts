// Document Management API for test results and files

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { documents, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/documents
 * Upload document/file (test result, image, PDF)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'upload_documents');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const patientId = parseInt(formData.get('patientId') as string);
    const testId = formData.get('testId') ? parseInt(formData.get('testId') as string) : null;
    const documentName = (formData.get('documentName') as string) || file.name;

    if (!file || !patientId) {
      return errorResponse('Missing required fields', 400);
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileData = buffer.toString('base64');

    const result = await db
      .insert(documents)
      .values({
        testId,
        patientId,
        documentName,
        documentType: file.type || 'pdf',
        fileSize: file.size,
        mimeType: file.type,
        fileData,
        uploadedByUserId: currentUser.id,
      })
      .returning();

    if (!result.length) {
      return errorResponse('Failed to upload document', 500);
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'uploaded',
      entityType: 'document',
      entityId: result[0].id,
      description: `Uploaded document: ${documentName}`,
    });

    return successResponse(result[0], 'Document uploaded', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * GET /api/documents/[id]
 * Download document
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'view_documents');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');

    const [doc] = (await db.select().from(documents).where(eq(documents.id, id))) as any[];

    if (!doc) {
      return errorResponse('Document not found', 404);
    }

    // Convert base64 back to binary
    const fileBuffer = Buffer.from(doc.fileData, 'base64');

    // Return file with proper headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.documentName}"`,
      },
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/documents/[id]
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'delete_documents');
    if (!session) {
      return errorResponse('Unauthorized', 403);
    }

    const currentUser = session.user as any;
    const id = parseInt(request.nextUrl.pathname.split('/').pop() || '0');

    const [doc] = (await db.select().from(documents).where(eq(documents.id, id))) as any[];

    if (!doc) {
      return errorResponse('Document not found', 404);
    }

    await db.delete(documents).where(eq(documents.id, id));

    // Audit log
    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: 'deleted',
      entityType: 'document',
      entityId: id,
      description: `Deleted document: ${doc.documentName}`,
    });

    return successResponse({ success: true }, 'Document deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

