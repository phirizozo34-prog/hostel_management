-- ============================================
-- HOSTEL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ZUCT Full-Stack Final Project
-- PostgreSQL
-- ============================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE
-- Stores both students and admin accounts
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  student_number VARCHAR(20) UNIQUE,
  phone VARCHAR(20),
  profile_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ROOMS TABLE
-- Hostel rooms available for booking
-- ============================================
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  block VARCHAR(10) NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('Single', 'Double', 'Triple')),
  capacity INTEGER NOT NULL,
  occupied INTEGER DEFAULT 0,
  price_per_month NUMERIC(10, 2) NOT NULL,
  amenities TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'full', 'maintenance')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BOOKINGS TABLE
-- Room allocation/booking records
-- ============================================
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_out')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE REQUESTS TABLE
-- Students report room/hostel issues
-- ============================================
CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  image_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SEED DATA
-- ============================================

-- Admin account (password: admin123)
INSERT INTO users (name, email, password_hash, role, student_number, phone)
VALUES (
  'Admin User',
  'admin@zuct.ac.zm',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  NULL,
  '+260 211 000 000'
);

-- Sample student (password: student123)
INSERT INTO users (name, email, password_hash, role, student_number, phone)
VALUES (
  'Moses Banda',
  'moses@zuct.ac.zm',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'student',
  '2410103',
  '+260 977 000 000'
);

-- Sample rooms
INSERT INTO rooms (room_number, block, type, capacity, occupied, price_per_month, amenities, status) VALUES
('A101', 'A', 'Single', 1, 0, 1500.00, 'Wi-Fi, Study Desk, Wardrobe', 'available'),
('A102', 'A', 'Double', 2, 1, 1200.00, 'Wi-Fi, Study Desk, Wardrobe, Shared Bathroom', 'available'),
('A103', 'A', 'Triple', 3, 3, 900.00,  'Wi-Fi, Study Desk, Wardrobe', 'full'),
('B201', 'B', 'Single', 1, 0, 1600.00, 'Wi-Fi, Study Desk, Wardrobe, En-Suite', 'available'),
('B202', 'B', 'Double', 2, 0, 1300.00, 'Wi-Fi, Study Desk, Wardrobe, Shared Bathroom', 'available'),
('B203', 'B', 'Triple', 3, 2, 950.00,  'Wi-Fi, Study Desk, Wardrobe', 'available'),
('C301', 'C', 'Single', 1, 0, 1400.00, 'Wi-Fi, Study Desk, Wardrobe', 'maintenance'),
('C302', 'C', 'Double', 2, 2, 1100.00, 'Wi-Fi, Study Desk, Wardrobe', 'full');
