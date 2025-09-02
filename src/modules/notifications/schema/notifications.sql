-- Notifications Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id),
  
  -- Message content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'normal',
  
  -- Targeting
  page_context VARCHAR(50) DEFAULT 'all',
  
  -- Source tracking
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  trigger_data JSONB,
  
  -- Status management
  status VARCHAR(20) DEFAULT 'active',
  read_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  
  -- Scheduling
  show_from TIMESTAMP DEFAULT NOW(),
  show_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Smart notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  
  -- Rule configuration
  trigger_condition JSONB NOT NULL,
  message_template TEXT NOT NULL,
  cooldown_hours INTEGER DEFAULT 24,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track rule triggers
CREATE TABLE IF NOT EXISTS notification_rule_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES notification_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP DEFAULT NOW(),
  trigger_data JSONB
);

-- Create indexes for performance
CREATE INDEX idx_notifications_client ON notifications(client_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_page ON notifications(page_context);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_rule_history_client ON notification_rule_history(client_id);

-- Insert default smart rules
INSERT INTO notification_rules (name, type, trigger_condition, message_template) VALUES
('Workout Plateau', 'workout', '{"type": "plateau", "weeks": 2}', 'Tijd om het gewicht te verhogen! Je doet al {weeks} weken hetzelfde gewicht.'),
('Protein Streak', 'meal', '{"type": "streak", "days": 7}', 'Top! {days} dagen op rij je eiwitdoel gehaald! 💪'),
('Training Streak', 'workout', '{"type": "streak", "days": 5}', '{days} dagen op rij getraind! Keep it up! 🔥'),
('Missed Workouts', 'workout', '{"type": "missed", "days": 3}', 'We missen je! Kom terug en crush je workout! 💪');

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rule_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Coaches can manage client notifications" ON notifications
  FOR ALL USING (auth.uid() = coach_id OR auth.uid() = client_id);

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_rules TO authenticated;
GRANT ALL ON notification_rule_history TO authenticated;
