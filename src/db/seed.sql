-- Create seed data for testing
-- Users
INSERT INTO users (email, username, password_hash, first_name, last_name, role, phone, is_active)
VALUES 
  ('admin@cabinet.local', 'admin', '$2a$10$KIXxPfxHKMkIVYevH9XU6O0wF5F5F5F5F5F5F5F5', 'Admin', 'User', 'admin', '555-0000', true),
  ('doctor@cabinet.local', 'doctor', '$2a$10$KIXxPfxHKMkIVYevH9XU6O0wF5F5F5F5F5F5F5F5', 'John', 'Doctor', 'doctor', '555-0001', true),
  ('secretary@cabinet.local', 'secretary', '$2a$10$KIXxPfxHKMkIVYevH9XU6O0wF5F5F5F5F5F5F5F5', 'Jane', 'Secretary', 'secretary', '555-0002', true);

-- Suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, payment_terms)
VALUES 
  ('Medical Supplies Inc', 'John Smith', 'contact@medicalsupplies.com', '+1-555-0100', '123 Main St', 'New York', 'USA', 'Net 30'),
  ('Pharma Global', 'Sarah Johnson', 'sales@pharmaglobal.com', '+1-555-0101', '456 Oak Ave', 'Los Angeles', 'USA', 'Net 15');

-- Patients (sample)
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, medical_history, insurance_number, insurance_provider, created_by_user_id)
VALUES 
  ('Robert', 'Johnson', 'robert@example.com', '555-1001', '1980-05-15', 'M', 'Hypertension, Diabetes', 'INS123456', 'Blue Cross', 1),
  ('Emma', 'Williams', 'emma@example.com', '555-1002', '1990-03-22', 'F', 'Asthma', 'INS789012', 'Aetna', 1),
  ('Michael', 'Brown', 'michael@example.com', '555-1003', '1975-08-10', 'M', 'No known conditions', 'INS345678', 'UnitedHealth', 1);

-- Stock Items
INSERT INTO stock_items (item_name, description, quantity, unit, min_stock_level, unit_price, supplier_id)
VALUES 
  ('Disposable Gloves', 'Latex-free medical gloves', 500, 'Box', 100, 25.50, 1),
  ('Face Masks', 'N95 Medical face masks', 1200, 'Box', 200, 35.00, 1),
  ('Syringes 5ml', 'Sterile disposable syringes', 300, 'Box', 50, 15.75, 2),
  ('Antibiotics Tablets', 'Amoxicillin 500mg', 150, 'Bottle', 30, 45.00, 2);
