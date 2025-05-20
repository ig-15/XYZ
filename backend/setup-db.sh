#!/bin/bash

# Load environment variables
source .env

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-1234}
DB_DATABASE=${DB_DATABASE:-parking_management}

echo "Setting up database: $DB_DATABASE"

# Create database if it doesn't exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE'" | grep -q 1 || PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -c "CREATE DATABASE $DB_DATABASE"

# Connect to the database and create tables
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE << EOF

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parkings table
CREATE TABLE IF NOT EXISTS parkings (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  total_spaces INTEGER NOT NULL,
  available_spaces INTEGER NOT NULL,
  fee_per_hour DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id) NOT NULL,
  parking_id INTEGER REFERENCES parkings(id) NOT NULL,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  charged_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES entries(id) NOT NULL,
  issued_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: Admin123)
INSERT INTO users (firstname, lastname, email, password_hash, role)
VALUES ('Admin', 'User', 'admin@example.com', '$2b$10$rIC1.1hLjWMxn9FYr0QIXuQ.vD3z5.KRcZ8C8NEcI4iBMEGGz18/y', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default attendant user (password: Attendant123)
INSERT INTO users (firstname, lastname, email, password_hash, role)
VALUES ('Attendant', 'User', 'attendant@example.com', '$2b$10$rIC1.1hLjWMxn9FYr0QIXuQ.vD3z5.KRcZ8C8NEcI4iBMEGGz18/y', 'attendant')
ON CONFLICT (email) DO NOTHING;

-- Insert default regular user (password: User123)
INSERT INTO users (firstname, lastname, email, password_hash, role)
VALUES ('Regular', 'User', 'user@example.com', '$2b$10$rIC1.1hLjWMxn9FYr0QIXuQ.vD3z5.KRcZ8C8NEcI4iBMEGGz18/y', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample parking locations
INSERT INTO parkings (code, name, location, total_spaces, available_spaces, fee_per_hour)
VALUES 
  ('P001', 'Main Building Parking', 'Main Street, Building A', 100, 100, 2.50),
  ('P002', 'Shopping Mall Parking', 'Commercial Avenue, Mall Plaza', 200, 200, 3.00),
  ('P003', 'Airport Parking', 'Airport Road, Terminal 1', 300, 300, 5.00)
ON CONFLICT (code) DO NOTHING;

EOF

echo "Database setup completed!"
