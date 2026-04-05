import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, doctorTeamMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '@/auth/middleware';
import { hashPassword } from '@/auth/utils';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/team/staff - Create a new staff member and add to doctor's team
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'create_staff');
    if (!session) return errorResponse('Unauthorized', 403);

    const currentUser = session.user as any;
    const body = await request.json();

    const { firstName, lastName, email, username, password, role, phone, department } = body;

    if (!firstName || !lastName || !email || !username || !password || !role) {
      return errorResponse('First name, last name, email, username, password, and role are required', 400);
    }

    const allowedRoles = ['nurse', 'secretariat'];
    if (!allowedRoles.includes(role)) {
      return errorResponse('Only nurse and secretariat roles are allowed', 400);
    }

    // Check for existing user
    const existing = await db.query.users.findFirst({
      where: (u, { eq, or }) => or(eq(u.email, email), eq(u.username, username)),
    });
    if (existing) {
      return errorResponse('A user with this email or username already exists', 409);
    }

    const passwordHash = await hashPassword(String(password));

    // Create the user
    const [newUser] = await db.insert(users).values({
      firstName,
      lastName,
      email,
      username,
      passwordHash,
      role: role as any,
      phone: phone || null,
      department: department || null,
      isActive: true,
    }).returning();

    // Automatically add to doctor's team
    await db.insert(doctorTeamMembers).values({
      doctorId: parseInt(currentUser.id),
      staffId: newUser.id,
    });

    return successResponse(
      {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        department: newUser.department,
      },
      'Staff member created and added to your team',
      201
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create staff member', 500);
  }
}

/**
 * PUT /api/team/staff - Update a staff member's details (only if in doctor's team)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'manage_staff');
    if (!session) return errorResponse('Unauthorized', 403);

    const currentUser = session.user as any;
    const body = await request.json();
    const { staffId, firstName, lastName, email, phone, department, isActive } = body;

    if (!staffId) return errorResponse('Staff member ID is required', 400);

    // Verify staff is in doctor's team
    const teamEntry = await db.query.doctorTeamMembers.findFirst({
      where: and(
        eq(doctorTeamMembers.doctorId, parseInt(currentUser.id)),
        eq(doctorTeamMembers.staffId, staffId)
      ),
    });
    if (!teamEntry) return errorResponse('Staff member is not in your team', 403);

    // Build update values
    const updateValues: Record<string, any> = { updatedAt: new Date() };
    if (firstName !== undefined) updateValues.firstName = firstName;
    if (lastName !== undefined) updateValues.lastName = lastName;
    if (email !== undefined) updateValues.email = email;
    if (phone !== undefined) updateValues.phone = phone;
    if (department !== undefined) updateValues.department = department;
    if (isActive !== undefined) updateValues.isActive = isActive;

    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, staffId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        department: users.department,
        isActive: users.isActive,
      });

    return successResponse(updated, 'Staff member updated');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update staff member', 500);
  }
}
