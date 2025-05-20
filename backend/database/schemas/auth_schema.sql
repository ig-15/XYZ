-- Auth Service Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE user_role AS ENUM ('admin', 'attendant', 'user');

-- Users table (auth-related fields only)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs table for auth events
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp);
