-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{"email": true, "sms": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create attendant_settings table
CREATE TABLE IF NOT EXISTS attendant_settings (
  attendant_id UUID PRIMARY KEY REFERENCES attendants(id) ON DELETE CASCADE,
  shift JSONB DEFAULT '{"startTime": "09:00", "endTime": "17:00"}'::jsonb,
  notifications JSONB DEFAULT '{"email": true, "sms": true}'::jsonb,
  auto_assign BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_number VARCHAR(20) NOT NULL,
  parking_space_id UUID REFERENCES parking_spaces(id),
  attendant_id UUID REFERENCES attendants(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_car_number ON tickets(car_number);
CREATE INDEX IF NOT EXISTS idx_tickets_attendant_id ON tickets(attendant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_parking_space_id ON tickets(parking_space_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendant_settings_updated_at
    BEFORE UPDATE ON attendant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 