import { NextRequest } from 'next/server';
import { db } from '@/db';
import { doctorTeamMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/team - Get the current doctor's team members
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_staff');
    if (!session) return errorResponse('Unauthorized', 403);

    const currentUser = session.user as any;

    const teamMembers = await db
      .select({
        id: doctorTeamMembers.id,
        staffId: doctorTeamMembers.staffId,
        createdAt: doctorTeamMembers.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        department: users.department,
        isActive: users.isActive,
      })
      .from(doctorTeamMembers)
      .innerJoin(users, eq(doctorTeamMembers.staffId, users.id))
      .where(eq(doctorTeamMembers.doctorId, parseInt(currentUser.id)));

    return successResponse(teamMembers);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch team', 500);
  }
}

/**
 * POST /api/team - Add a staff member to the doctor's team
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_staff');
    if (!session) return errorResponse('Unauthorized', 403);

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.staffId) {
      return errorResponse('Staff member ID is required', 400);
    }

    // Verify the staff member exists and has an appropriate role
    const staffMember = await db.query.users.findFirst({
      where: eq(users.id, body.staffId),
    });

    if (!staffMember) return errorResponse('Staff member not found', 404);

    const allowedRoles = ['nurse', 'secretariat'];
    if (!allowedRoles.includes(staffMember.role)) {
      return errorResponse('Only nurses and secretariat staff can be added to a team', 400);
    }

    // Check if already in the team
    const existing = await db.query.doctorTeamMembers.findFirst({
      where: and(
        eq(doctorTeamMembers.doctorId, parseInt(currentUser.id)),
        eq(doctorTeamMembers.staffId, body.staffId)
      ),
    });

    if (existing) return errorResponse('Staff member is already in your team', 400);

    const [result] = await db
      .insert(doctorTeamMembers)
      .values({
        doctorId: parseInt(currentUser.id),
        staffId: body.staffId,
      })
      .returning();

    return successResponse(result, 'Staff member added to team', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to add team member', 500);
  }
}

/**
 * DELETE /api/team - Remove a staff member from the team
 * Expects { staffId: number } in body
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_staff');
    if (!session) return errorResponse('Unauthorized', 403);

    const currentUser = session.user as any;
    const body = await request.json();

    if (!body.staffId) {
      return errorResponse('Staff member ID is required', 400);
    }

    const deleted = await db
      .delete(doctorTeamMembers)
      .where(
        and(
          eq(doctorTeamMembers.doctorId, parseInt(currentUser.id)),
          eq(doctorTeamMembers.staffId, body.staffId)
        )
      )
      .returning();

    if (deleted.length === 0) return errorResponse('Team member not found', 404);

    return successResponse(null, 'Staff member removed from team');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to remove team member', 500);
  }
}
