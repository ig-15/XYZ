-- Car Entry Service Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL,
    parking_id UUID NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP WITH TIME ZONE,
    charged_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL,
    issued_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs table for car entry events
CREATE TABLE IF NOT EXISTS entry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    entry_id UUID,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cars_plate_number ON cars(plate_number);
CREATE INDEX IF NOT EXISTS idx_entries_car_id ON entries(car_id);
CREATE INDEX IF NOT EXISTS idx_entries_parking_id ON entries(parking_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_time ON entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_tickets_entry_id ON tickets(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_logs_entry_id ON entry_logs(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_logs_timestamp ON entry_logs(timestamp);
