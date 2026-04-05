import { 
  pgTable, text, serial, timestamp, boolean, integer, decimal, varchar, pgEnum, jsonb, date, index 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// ============= ENUMS =============

// Roles enum with all required roles
export const roleEnum = pgEnum('role', ['patient', 'secretariat', 'doctor', 'nurse', 'it_operator', 'it_master']);

// Appointment status enum
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
]);

// Prescription status enum
export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'draft', 'issued', 'printed'
]);

// Invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'pending_approval', 'approved', 'rejected', 'submitted', 'paid'
]);

// Test status enum
export const testStatusEnum = pgEnum('test_status', [
  'pending', 'in_progress', 'completed', 'cancelled'
]);

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'patient_arrival', 'test_completed', 'appointment_confirmed', 'invoice_ready', 'stock_low', 'appointment_reminder'
]);

// Stock transaction type enum
export const stockTransactionTypeEnum = pgEnum('stock_transaction_type', [
  'purchase', 'usage', 'return', 'adjustment', 'waste'
]);

// ============= CORE TABLES =============

// Users table (all roles)
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    username: varchar('username', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    role: roleEnum('role').notNull().default('patient'),
    phone: varchar('phone', { length: 20 }),
    department: varchar('department', { length: 255 }), // For doctors and staff
    specialization: varchar('specialization', { length: 255 }), // For doctors
    licenseNumber: varchar('license_number', { length: 255 }), // For doctors
    isActive: boolean('is_active').notNull().default(true),
    profileImage: text('profile_image'), // Base64 or file path
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

// Patients table
export const patients = pgTable(
  'patients',
  {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    dateOfBirth: date('date_of_birth'),
    gender: varchar('gender', { length: 50 }), // Male, Female, Other
    age: integer('age'),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    country: varchar('country', { length: 100 }),
    medicalHistory: text('medical_history'),
    allergies: text('allergies'),
    insuranceNumber: varchar('insurance_number', { length: 255 }),
    insuranceProvider: varchar('insurance_provider', { length: 255 }),
    insuranceExpiry: date('insurance_expiry'),
    emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    notes: text('notes'),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // Link to patient user account
    createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    phoneIdx: index('patients_phone_idx').on(table.phone),
    emailIdx: index('patients_email_idx').on(table.email),
  })
);

// ============= APPOINTMENT & SESSION TABLES =============

// Appointments table
export const appointments = pgTable(
  'appointments',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    doctorId: integer('doctor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    appointmentDate: timestamp('appointment_date').notNull(),
    duration: integer('duration').notNull().default(30), // in minutes
    status: appointmentStatusEnum('status').notNull().default('pending'),
    description: text('description'),
    notes: text('notes'),
    notifiedAt: timestamp('notified_at'), // When doctor was notified of patient arrival
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    appointmentDateIdx: index('appointments_date_idx').on(table.appointmentDate),
    doctorIdx: index('appointments_doctor_idx').on(table.doctorId),
    patientIdx: index('appointments_patient_idx').on(table.patientId),
  })
);

// Patient Visit Sessions - Dynamic sessions for each appointment/visit
export const visitSessions = pgTable(
  'visit_sessions',
  {
    id: serial('id').primaryKey(),
    appointmentId: integer('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
    patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    doctorId: integer('doctor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    sessionName: varchar('session_name', { length: 255 }).notNull(), // e.g., "Cardiology Visit", "ECG Session"
    sessionType: varchar('session_type', { length: 100 }).notNull(), // e.g., "cardiology", "general_checkup", "follow_up"
    description: text('description'),
    startTime: timestamp('start_time'),
    endTime: timestamp('end_time'),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('active'), // active, completed, cancelled
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    appointmentIdx: index('visit_sessions_appointment_idx').on(table.appointmentId),
    patientIdx: index('visit_sessions_patient_idx').on(table.patientId),
  })
);

// ============= TEST & DIAGNOSTIC TABLES =============

// Test Templates - Predefined tests available in the cabinet
export const testTemplates = pgTable(
  'test_templates',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(), // e.g., "blood_test", "imaging", "vital_signs", "ecg"
    unit: varchar('unit', { length: 50 }), // e.g., "mg/dL", "mmHg", "bpm"
    referenceRange: varchar('reference_range', { length: 255 }), // e.g., "70-100"
    price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
    requiredEquipment: text('required_equipment'), // JSON or text
    isActive: boolean('is_active').notNull().default(true),
    createdByUserId: integer('created_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('test_templates_category_idx').on(table.category),
  })
);

// Tests - Actual test records for patients
export const tests = pgTable(
  'tests',
  {
    id: serial('id').primaryKey(),
    testTemplateId: integer('test_template_id').notNull().references(() => testTemplates.id, { onDelete: 'restrict' }),
    appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
    visitSessionId: integer('visit_session_id').references(() => visitSessions.id, { onDelete: 'set null' }),
    patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    doctorId: integer('doctor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    assignedNurseId: integer('assigned_nurse_id').references(() => users.id, { onDelete: 'set null' }),
    status: testStatusEnum('status').notNull().default('pending'),
    result: text('result'), // The actual test result
    resultValue: varchar('result_value', { length: 255 }), // Numeric or categorical result
    notes: text('notes'),
    performedAt: timestamp('performed_at'),
    performedByUserId: integer('performed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    reportUrl: text('report_url'), // URL to PDF/image report
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index('tests_patient_idx').on(table.patientId),
    statusIdx: index('tests_status_idx').on(table.status),
    appointmentIdx: index('tests_appointment_idx').on(table.appointmentId),
  })
);

// ============= PRESCRIPTION & MEDICATION TABLES =============

// Prescriptions table
export const prescriptions = pgTable(
  'prescriptions',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    doctorId: integer('doctor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
    visitSessionId: integer('visit_session_id').references(() => visitSessions.id, { onDelete: 'set null' }),
    prescriptionDate: timestamp('prescription_date').notNull().defaultNow(),
    status: prescriptionStatusEnum('status').notNull().default('draft'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index('prescriptions_patient_idx').on(table.patientId),
    statusIdx: index('prescriptions_status_idx').on(table.status),
  })
);

// Prescription details (medication items in a prescription)
export const prescriptionDetails = pgTable(
  'prescription_details',
  {
    id: serial('id').primaryKey(),
    prescriptionId: integer('prescription_id').notNull().references(() => prescriptions.id, { onDelete: 'cascade' }),
    medicationName: varchar('medication_name', { length: 255 }).notNull(),
    dosage: varchar('dosage', { length: 100 }).notNull(),
    frequency: varchar('frequency', { length: 100 }).notNull(), // e.g., "2 times daily"
    duration: varchar('duration', { length: 100 }).notNull(), // e.g., "7 days"
    instructions: text('instructions'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  }
);

// ============= INVOICE & BILLING TABLES =============

// Invoices table
export const invoices = pgTable(
  'invoices',
  {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
    patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
    visitSessionId: integer('visit_session_id').references(() => visitSessions.id, { onDelete: 'set null' }),
    createdByUserId: integer('created_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    approvedByDoctorId: integer('approved_by_doctor_id').references(() => users.id, { onDelete: 'set null' }),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
    tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
    discount: decimal('discount', { precision: 10, scale: 2 }).notNull().default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
    paymentMethod: varchar('payment_method', { length: 50 }), // cash, card, insurance, check
    notes: text('notes'),
    dueDate: date('due_date'),
    paidAt: timestamp('paid_at'),
    paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }),
    approvalRequestedAt: timestamp('approval_requested_at'),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    invoiceNumberIdx: index('invoices_number_idx').on(table.invoiceNumber),
    patientIdx: index('invoices_patient_idx').on(table.patientId),
    statusIdx: index('invoices_status_idx').on(table.status),
  })
);

// Invoice line items
export const invoiceLineItems = pgTable(
  'invoice_line_items',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    testId: integer('test_id').references(() => tests.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  }
);

// ============= STOCK MANAGEMENT TABLES =============

// Stock items table
export const stockItems = pgTable(
  'stock_items',
  {
    id: serial('id').primaryKey(),
    itemName: varchar('item_name', { length: 255 }).notNull().unique(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(), // consumables, equipment, etc.
    quantity: integer('quantity').notNull().default(0),
    unit: varchar('unit', { length: 50 }).notNull(), // e.g., "Box", "Bottle", "Units", "Ml"
    minStockLevel: integer('min_stock_level').notNull().default(10),
    maxStockLevel: integer('max_stock_level'),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    lastRestockDate: timestamp('last_restock_date'),
    reorderPoint: integer('reorder_point').default(10),
    createdByUserId: integer('created_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('stock_items_category_idx').on(table.category),
    quantityIdx: index('stock_items_quantity_idx').on(table.quantity),
  })
);

// Stock transactions log
export const stockTransactions = pgTable(
  'stock_transactions',
  {
    id: serial('id').primaryKey(),
    stockItemId: integer('stock_item_id').notNull().references(() => stockItems.id, { onDelete: 'cascade' }),
    transactionType: stockTransactionTypeEnum('transaction_type').notNull(),
    quantity: integer('quantity').notNull(),
    previousQuantity: integer('previous_quantity').notNull(),
    newQuantity: integer('new_quantity').notNull(),
    reason: text('reason'),
    referenceId: integer('reference_id'), // links to restock order or test
    performedByUserId: integer('performed_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    stockItemIdx: index('stock_transactions_item_idx').on(table.stockItemId),
    createdAtIdx: index('stock_transactions_date_idx').on(table.createdAt),
  })
);

// Suppliers table
export const suppliers = pgTable(
  'suppliers',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    fax: varchar('fax', { length: 20 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }),
    zipCode: varchar('zip_code', { length: 20 }),
    paymentTerms: varchar('payment_terms', { length: 255 }),
    taxId: varchar('tax_id', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  }
);

// Restock orders table
export const restockOrders = pgTable(
  'restock_orders',
  {
    id: serial('id').primaryKey(),
    stockItemId: integer('stock_item_id').notNull().references(() => stockItems.id, { onDelete: 'restrict' }),
    supplierId: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    orderDate: timestamp('order_date').notNull().defaultNow(),
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    actualDeliveryDate: timestamp('actual_delivery_date'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, received, cancelled
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
    orderNotes: text('order_notes'),
    orderedByUserId: integer('ordered_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('restock_orders_status_idx').on(table.status),
    orderDateIdx: index('restock_orders_date_idx').on(table.orderDate),
  })
);

// ============= NOTIFICATION TABLES =============

// Notifications table
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    relatedEntityType: varchar('related_entity_type', { length: 100 }), // appointment, test, invoice, etc.
    relatedEntityId: integer('related_entity_id'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    actionUrl: text('action_url'),
    data: jsonb('data'), // Additional context data
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
    isReadIdx: index('notifications_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_date_idx').on(table.createdAt),
  })
);

// ============= DOCUMENT/FILE TABLES =============

// Documents - Store test results, images, PDFs
export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    testId: integer('test_id').references(() => tests.id, { onDelete: 'cascade' }),
    patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    documentName: varchar('document_name', { length: 255 }).notNull(),
    documentType: varchar('document_type', { length: 100 }).notNull(), // pdf, image, report, etc.
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    fileData: text('file_data'), // Binary data stored as base64
    fileUrl: text('file_url'), // Or URL if stored externally
    uploadedByUserId: integer('uploaded_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index('documents_patient_idx').on(table.patientId),
    testIdx: index('documents_test_idx').on(table.testId),
  })
);

// ============= AUDIT LOG TABLES =============

// Audit logs - Track all important actions
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 255 }).notNull(), // created, updated, deleted, printed, approved, etc.
    entityType: varchar('entity_type', { length: 100 }).notNull(), // appointment, invoice, stock, etc.
    entityId: integer('entity_id'),
    description: text('description'),
    changeData: jsonb('change_data'), // What was changed
    ipAddress: varchar('ip_address', { length: 50 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('audit_logs_user_idx').on(table.userId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType),
    createdAtIdx: index('audit_logs_date_idx').on(table.createdAt),
  })
);

// ============= DOCTOR TEAM TABLE =============

// Doctor team members - associates staff with a doctor
export const doctorTeamMembers = pgTable(
  'doctor_team_members',
  {
    id: serial('id').primaryKey(),
    doctorId: integer('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    staffId: integer('staff_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    doctorIdx: index('team_doctor_idx').on(table.doctorId),
    staffIdx: index('team_staff_idx').on(table.staffId),
  })
);

// ============= RELATIONS =============

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  createdPatients: many(patients),
  appointments: many(appointments),
  prescriptions: many(prescriptions),
  visitSessions: many(visitSessions),
  tests: many(tests),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

// Patient relations
export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [patients.createdByUserId],
    references: [users.id],
  }),
  appointments: many(appointments),
  prescriptions: many(prescriptions),
  visitSessions: many(visitSessions),
  tests: many(tests),
  invoices: many(invoices),
  documents: many(documents),
}));

// Appointment relations
export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  visitSessions: many(visitSessions),
  prescriptions: many(prescriptions),
  tests: many(tests),
  invoices: many(invoices),
}));

// Visit session relations
export const visitSessionsRelations = relations(visitSessions, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [visitSessions.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [visitSessions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [visitSessions.doctorId],
    references: [users.id],
  }),
  tests: many(tests),
  prescriptions: many(prescriptions),
  invoices: many(invoices),
}));

// Test relations
export const testsRelations = relations(tests, ({ one, many }) => ({
  template: one(testTemplates, {
    fields: [tests.testTemplateId],
    references: [testTemplates.id],
  }),
  appointment: one(appointments, {
    fields: [tests.appointmentId],
    references: [appointments.id],
  }),
  visitSession: one(visitSessions, {
    fields: [tests.visitSessionId],
    references: [visitSessions.id],
  }),
  patient: one(patients, {
    fields: [tests.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [tests.doctorId],
    references: [users.id],
  }),
  assignedNurse: one(users, {
    fields: [tests.assignedNurseId],
    references: [users.id],
  }),
  performedBy: one(users, {
    fields: [tests.performedByUserId],
    references: [users.id],
  }),
  documents: many(documents),
  invoiceLineItems: many(invoiceLineItems),
}));

// Test template relations
export const testTemplatesRelations = relations(testTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testTemplates.createdByUserId],
    references: [users.id],
  }),
  tests: many(tests),
}));

// Prescription relations
export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [prescriptions.doctorId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [prescriptions.appointmentId],
    references: [appointments.id],
  }),
  visitSession: one(visitSessions, {
    fields: [prescriptions.visitSessionId],
    references: [visitSessions.id],
  }),
  details: many(prescriptionDetails),
}));

// Prescription details relations
export const prescriptionDetailsRelations = relations(prescriptionDetails, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionDetails.prescriptionId],
    references: [prescriptions.id],
  }),
}));

// Invoice relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [invoices.appointmentId],
    references: [appointments.id],
  }),
  visitSession: one(visitSessions, {
    fields: [invoices.visitSessionId],
    references: [visitSessions.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdByUserId],
    references: [users.id],
  }),
  approvedByDoctor: one(users, {
    fields: [invoices.approvedByDoctorId],
    references: [users.id],
  }),
  lineItems: many(invoiceLineItems),
}));

// Invoice line item relations
export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  test: one(tests, {
    fields: [invoiceLineItems.testId],
    references: [tests.id],
  }),
}));

// Stock item relations
export const stockItemsRelations = relations(stockItems, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [stockItems.supplierId],
    references: [suppliers.id],
  }),
  createdBy: one(users, {
    fields: [stockItems.createdByUserId],
    references: [users.id],
  }),
  transactions: many(stockTransactions),
  restockOrders: many(restockOrders),
}));

// Stock transaction relations
export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  stockItem: one(stockItems, {
    fields: [stockTransactions.stockItemId],
    references: [stockItems.id],
  }),
  performedBy: one(users, {
    fields: [stockTransactions.performedByUserId],
    references: [users.id],
  }),
}));

// Supplier relations
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  stockItems: many(stockItems),
  restockOrders: many(restockOrders),
}));

// Restock order relations
export const restockOrdersRelations = relations(restockOrders, ({ one }) => ({
  stockItem: one(stockItems, {
    fields: [restockOrders.stockItemId],
    references: [stockItems.id],
  }),
  supplier: one(suppliers, {
    fields: [restockOrders.supplierId],
    references: [suppliers.id],
  }),
  orderedBy: one(users, {
    fields: [restockOrders.orderedByUserId],
    references: [users.id],
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Document relations
export const documentsRelations = relations(documents, ({ one }) => ({
  test: one(tests, {
    fields: [documents.testId],
    references: [tests.id],
  }),
  patient: one(patients, {
    fields: [documents.patientId],
    references: [patients.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedByUserId],
    references: [users.id],
  }),
}));

// Audit log relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Doctor team member relations
export const doctorTeamMembersRelations = relations(doctorTeamMembers, ({ one }) => ({
  doctor: one(users, {
    fields: [doctorTeamMembers.doctorId],
    references: [users.id],
    relationName: 'doctorTeam',
  }),
  staff: one(users, {
    fields: [doctorTeamMembers.staffId],
    references: [users.id],
    relationName: 'staffMember',
  }),
}));

// ============= ZOD SCHEMAS =============

// Export schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPatientSchema = createInsertSchema(patients);
export const selectPatientSchema = createSelectSchema(patients);
export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);
export const insertVisitSessionSchema = createInsertSchema(visitSessions);
export const selectVisitSessionSchema = createSelectSchema(visitSessions);
export const insertTestSchema = createInsertSchema(tests);
export const selectTestSchema = createSelectSchema(tests);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const selectInvoiceSchema = createSelectSchema(invoices);
export const insertStockItemSchema = createInsertSchema(stockItems);
export const selectStockItemSchema = createSelectSchema(stockItems);
export const insertPrescriptionSchema = createInsertSchema(prescriptions);
export const selectPrescriptionSchema = createSelectSchema(prescriptions);
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const selectSupplierSchema = createSelectSchema(suppliers);
