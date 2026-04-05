import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export function getUserFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export type Role = 'admin' | 'doctor' | 'secretary';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['view_all', 'manage_users', 'manage_settings', 'manage_stock', 'manage_suppliers'],
  doctor: ['view_patients', 'create_appointments', 'create_prescriptions', 'view_stock'],
  secretary: ['view_patients', 'manage_appointments', 'manage_stock', 'view_suppliers'],
};

export function hasPermission(userRole: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function canAccess(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}
