-- Reporting Service Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Denormalized tables for reporting (read-only)
CREATE TABLE IF NOT EXISTS parking_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parking_id UUID NOT NULL,
    date DATE NOT NULL,
    total_entries INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    avg_duration_minutes INTEGER NOT NULL DEFAULT 0,
    max_occupancy_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_activity_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    total_parkings INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    favorite_parking_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs table for reporting events
CREATE TABLE IF NOT EXISTS report_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parking_stats_parking_id_date ON parking_daily_stats(parking_id, date);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id_date ON user_activity_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_report_logs_timestamp ON report_logs(timestamp);
