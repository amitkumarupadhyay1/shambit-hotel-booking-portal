-- Migration: add_room_availability_system
-- Add quantity column to rooms table
ALTER TABLE rooms ADD COLUMN quantity INTEGER DEFAULT 1;

-- Create room_availability table
CREATE TABLE room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_count INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_room_availability_room_date ON room_availability(room_id, date);
CREATE INDEX idx_room_availability_date ON room_availability(date);

-- Update existing rooms to have default quantity of 1
UPDATE rooms SET quantity = 1 WHERE quantity IS NULL;