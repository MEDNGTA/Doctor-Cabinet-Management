import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth/config';
import { hashPassword, comparePasswords } from '@/auth/utils';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    const userId = parseInt((session.user as any).id);
    const role = (session.user as any).role;

    // Only allow password change for roles other than nurse and secretariat
    if (role === 'nurse' || role === 'secretariat') {
      return errorResponse('Not allowed for this role', 403);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400);
    }

    // Get user from DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Verify current password
    const isValid = await comparePasswords(String(currentPassword), user.passwordHash);
    if (!isValid) {
      return errorResponse('Current password is incorrect', 400);
    }

    // Hash and update
    const newHash = await hashPassword(String(newPassword));
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, userId));

    return successResponse(null, 'Password updated successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('Failed to change password', 500);
  }
}
