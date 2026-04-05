// Middleware for role-based authorization and authentication

import { auth } from './config';
import { hasPermission, hasAnyPermission, hasAllPermissions, PermissionKey, Role } from './permissions';
import { errorResponse } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect routes - checks if user is authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return errorResponse('Unauthorized: Please log in', 401, 'Authentication required');
  }

  return session;
}

/**
 * Middleware to check specific role
 */
export async function requireRole(_request: NextRequest, requiredRole: Role) {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const userRole = (session.user as any).role as Role;

  if (userRole !== requiredRole) {
    return null;
  }

  return session;
}

/**
 * Middleware to check any of multiple roles
 */
export async function requireAnyRole(_request: NextRequest, roles: Role[]) {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const userRole = (session.user as any).role as Role;

  if (!roles.includes(userRole)) {
    return null;
  }

  return session;
}

/**
 * Middleware to check specific permission
 */
export async function requirePermission(_request: NextRequest, permission: PermissionKey) {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const userRole = (session.user as any).role as Role;

  if (!hasPermission(userRole, permission)) {
    return null;
  }

  return session;
}

/**
 * Middleware to check any of multiple permissions
 */
export async function requireAnyPermission(_request: NextRequest, permissions: PermissionKey[]) {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const userRole = (session.user as any).role as Role;

  if (!hasAnyPermission(userRole, permissions)) {
    return null;
  }

  return session;
}

/**
 * Middleware to check all permissions
 */
export async function requireAllPermissions(_request: NextRequest, permissions: PermissionKey[]) {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const userRole = (session.user as any).role as Role;

  if (!hasAllPermissions(userRole, permissions)) {
    return null;
  }

  return session;
}

/**
 * Check role without middleware (for use in server components)
 */
export async function checkRole(requiredRole: Role) {
  const session = await auth();

  if (!session || !session.user) {
    return false;
  }

  const userRole = (session.user as any).role as Role;
  return userRole === requiredRole;
}

/**
 * Check any role without middleware
 */
export async function checkAnyRole(roles: Role[]) {
  const session = await auth();

  if (!session || !session.user) {
    return false;
  }

  const userRole = (session.user as any).role as Role;
  return roles.includes(userRole);
}

/**
 * Check permission without middleware
 */
export async function checkPermission(permission: PermissionKey) {
  const session = await auth();

  if (!session || !session.user) {
    return false;
  }

  const userRole = (session.user as any).role as Role;
  return hasPermission(userRole, permission);
}

/**
 * Get current user session in server components
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Get current user role
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).role as Role;
}
