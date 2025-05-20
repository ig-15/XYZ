
-- Database setup for XYZ Ltd Parking Management System

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE user_role AS ENUM ('admin', 'attendant', 'user');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parkings table
CREATE TABLE IF NOT EXISTS parkings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    total_spaces INTEGER NOT NULL CHECK (total_spaces > 0),
    available_spaces INTEGER NOT NULL,
    fee_per_hour DECIMAL(10, 2) NOT NULL CHECK (fee_per_hour >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (available_spaces <= total_spaces)
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP WITH TIME ZONE,
    charged_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    issued_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cars_plate_number ON cars(plate_number);
CREATE INDEX IF NOT EXISTS idx_entries_car_id ON entries(car_id);
CREATE INDEX IF NOT EXISTS idx_entries_parking_id ON entries(parking_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_time ON entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
