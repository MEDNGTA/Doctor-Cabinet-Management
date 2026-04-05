import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, and, SQL } from 'drizzle-orm';
import { requireAuth } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || 'json' in session) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const conditions: SQL[] = [];
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(users.firstName, pattern),
          like(users.lastName, pattern),
          like(users.email, pattern),
        )!
      );
    }

    const result = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch users', 500);
  }
}
