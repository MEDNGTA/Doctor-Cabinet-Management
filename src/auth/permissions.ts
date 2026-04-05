// Role-based permissions configuration

export type Role = 'patient' | 'secretariat' | 'doctor' | 'nurse' | 'it_operator' | 'it_master';

// Permission types
export type PermissionKey =
  // Appointment permissions
  | 'view_appointments'
  | 'create_appointment'
  | 'edit_appointment'
  | 'delete_appointment'
  | 'confirm_appointment'
  | 'notify_appointment'
  
  // Patient permissions
  | 'view_patients'
  | 'create_patient'
  | 'edit_patient'
  | 'delete_patient'
  | 'view_patient_history'
  
  // Prescription permissions
  | 'create_prescription'
  | 'edit_prescription'
  | 'print_prescription'
  | 'delete_prescription'
  | 'view_prescriptions'
  
  // Test permissions
  | 'create_test'
  | 'perform_test'
  | 'view_test_results'
  | 'define_test_templates'
  | 'assign_tests'
  
  // Invoice permissions
  | 'create_invoice'
  | 'edit_invoice'
  | 'approve_invoice'
  | 'print_invoice'
  | 'add_test_to_invoice'
  | 'confirm_invoice'
  | 'delete_invoice'
  
  // Stock permissions
  | 'view_stock'
  | 'manage_stock'
  | 'create_restock_order'
  | 'receive_stock'
  | 'track_stock_usage'
  
  // Session permissions
  | 'create_session'
  | 'manage_sessions'
  | 'edit_session'
  
  // Notification permissions
  | 'receive_notifications'
  | 'view_notifications'
  
  // File/Document permissions
  | 'upload_documents'
  | 'view_documents'
  | 'delete_documents'
  
  // User management permissions
  | 'manage_users'
  | 'manage_accounts'
  | 'change_password'
  | 'manage_roles'
  | 'manage_staff'
  | 'create_staff'
  
  // Role management permissions
  | 'manage_all_roles'
  | 'manage_limited_roles'
  
  // Audit & logs
  | 'view_audit_logs'
  | 'view_stock_logs'
  
  // System
  | 'access_system';

// Define permissions for each role
export const rolePermissions: Record<Role, PermissionKey[]> = {
  patient: [
    'view_appointments',
    'create_appointment',
    'view_patient_history',
    'view_prescriptions',
    'view_documents',
    'receive_notifications',
    'view_notifications',
    'change_password',
    'access_system',
  ],

  secretariat: [
    'view_appointments',
    'create_appointment',
    'edit_appointment',
    'delete_appointment',
    'confirm_appointment',
    'notify_appointment',
    'view_patients',
    'create_patient',
    'edit_patient',
    'view_patient_history',
    'view_prescriptions',
    'print_prescription',
    'create_invoice',
    'edit_invoice',
    'add_test_to_invoice',
    'print_invoice',
    'view_stock',
    'track_stock_usage',
    'create_session',
    'manage_sessions',
    'edit_session',
    'upload_documents',
    'view_documents',
    'receive_notifications',
    'view_notifications',
    'change_password',
    'access_system',
  ],

  doctor: [
    'view_appointments',
    'create_appointment',
    'edit_appointment',
    'confirm_appointment',
    'notify_appointment',
    'view_patients',
    'create_patient',
    'edit_patient',
    'delete_patient',
    'view_patient_history',
    'create_prescription',
    'edit_prescription',
    'view_prescriptions',
    'print_prescription',
    'create_test',
    'view_test_results',
    'define_test_templates',
    'assign_tests',
    'create_invoice',
    'edit_invoice',
    'approve_invoice',
    'print_invoice',
    'add_test_to_invoice',
    'confirm_invoice',
    'view_stock',
    'manage_stock',
    'track_stock_usage',
    'create_session',
    'manage_sessions',
    'edit_session',
    'upload_documents',
    'view_documents',
    'manage_staff',
    'create_staff',
    'receive_notifications',
    'view_notifications',
    'change_password',
    'access_system',
  ],

  nurse: [
    'view_appointments',
    'view_patients',
    'view_patient_history',
    'view_prescriptions',
    'create_test',
    'perform_test',
    'view_test_results',
    'track_stock_usage',
    'view_stock',
    'upload_documents',
    'view_documents',
    'receive_notifications',
    'view_notifications',
    'change_password',
    'access_system',
  ],

  it_operator: [
    'view_appointments',
    'view_patients',
    'view_prescriptions',
    'view_stock',
    'manage_accounts',
    'manage_limited_roles',
    'view_audit_logs',
    'view_notifications',
    'change_password',
    'access_system',
  ],

  it_master: [
    // IT Master has all permissions except they can't be deleted
    'view_appointments',
    'create_appointment',
    'edit_appointment',
    'delete_appointment',
    'confirm_appointment',
    'notify_appointment',
    'view_patients',
    'create_patient',
    'edit_patient',
    'delete_patient',
    'view_patient_history',
    'create_prescription',
    'edit_prescription',
    'print_prescription',
    'delete_prescription',
    'view_prescriptions',
    'create_test',
    'perform_test',
    'view_test_results',
    'define_test_templates',
    'assign_tests',
    'create_invoice',
    'edit_invoice',
    'approve_invoice',
    'print_invoice',
    'add_test_to_invoice',
    'confirm_invoice',
    'delete_invoice',
    'view_stock',
    'manage_stock',
    'create_restock_order',
    'receive_stock',
    'track_stock_usage',
    'create_session',
    'manage_sessions',
    'edit_session',
    'upload_documents',
    'view_documents',
    'delete_documents',
    'manage_accounts',
    'manage_all_roles',
    'manage_staff',
    'view_audit_logs',
    'view_stock_logs',
    'receive_notifications',
    'view_notifications',
    'change_password',
    'access_system',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsByRole(role: Role): PermissionKey[] {
  return rolePermissions[role] ?? [];
}

// Role hierarchy for some operations
export const roleHierarchy: Record<Role, number> = {
  patient: 1,
  nurse: 2,
  secretariat: 3,
  doctor: 4,
  it_operator: 5,
  it_master: 6,
};

/**
 * Check if a user can manage another user based on roles
 * A user can only manage users with a lower hierarchy level
 */
export function canManageRole(userRole: Role, targetRole: Role): boolean {
  if (userRole === 'it_master') {
    return targetRole !== 'it_master'; // IT Master can manage all except IT Master
  }
  if (userRole === 'it_operator') {
    return roleHierarchy[targetRole] < roleHierarchy['it_operator'];
  }
  return false;
}
