-- Parking Service Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Logs table for parking events
CREATE TABLE IF NOT EXISTS parking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    parking_id UUID,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parkings_code ON parkings(code);
CREATE INDEX IF NOT EXISTS idx_parking_logs_parking_id ON parking_logs(parking_id);
CREATE INDEX IF NOT EXISTS idx_parking_logs_timestamp ON parking_logs(timestamp);
