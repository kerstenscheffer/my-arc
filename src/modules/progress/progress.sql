-- src/modules/progress/progress.sql
-- MY ARC Progress Module - Database Schema
-- Run this in Supabase SQL Editor

-- ===== WORKOUT PROGRESS TABLE =====
-- Main table for logging workout progress
CREATE TABLE IF NOT EXISTS workout_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  sets JSONB NOT NULL, -- Array of {weight: number, reps: number}
  notes TEXT,
  coach_suggestion TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Index for faster queries
  INDEX idx_workout_progress_client_date (client_id, date),
  INDEX idx_workout_progress_exercise (client_id, exercise_name)
);

-- ===== WEIGHT TRACKING TABLE =====
-- Track weight changes over time
CREATE TABLE IF NOT EXISTS weight_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate entries for same date
  UNIQUE(client_id, date),
  INDEX idx_weight_tracking_client (client_id, date DESC)
);

-- ===== CLIENT GOALS TABLE =====
-- Store various types of goals
CREATE TABLE IF NOT EXISTS client_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  goal_type VARCHAR(50) NOT NULL, -- 'weight', 'weekly_workouts', etc.
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2),
  start_value DECIMAL(10,2),
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One goal per type per client
  UNIQUE(client_id, goal_type),
  INDEX idx_client_goals (client_id)
);

-- ===== EXERCISE GOALS TABLE =====
-- Specific exercise targets
CREATE TABLE IF NOT EXISTS exercise_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  goal_type VARCHAR(50) NOT NULL, -- 'weight', 'reps', '1rm'
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2),
  achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One goal per exercise per client
  UNIQUE(client_id, exercise_name),
  INDEX idx_exercise_goals (client_id, exercise_name)
);

-- ===== WORKOUT COMPLETION TABLE =====
-- Track which workouts were completed (for accountability)
CREATE TABLE IF NOT EXISTS workout_completion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  workout_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  skipped_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- One entry per day per client
  UNIQUE(client_id, workout_date),
  INDEX idx_workout_completion (client_id, workout_date DESC)
);

-- ===== PROGRESS MILESTONES TABLE =====
-- Track significant achievements
CREATE TABLE IF NOT EXISTS progress_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  milestone_type VARCHAR(100) NOT NULL, -- 'weight_goal_reached', 'new_pr', 'streak_achieved'
  milestone_value JSONB, -- Flexible data storage
  achieved_date DATE DEFAULT CURRENT_DATE,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== EXERCISE VIDEOS TABLE =====
-- Store exercise tutorial video URLs
CREATE TABLE IF NOT EXISTS exercise_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name VARCHAR(255) UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS on all tables
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_videos ENABLE ROW LEVEL SECURITY;

-- Workout Progress Policies
CREATE POLICY "Clients can view own workout progress" ON workout_progress
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = workout_progress.client_id
  ));

CREATE POLICY "Clients can insert own workout progress" ON workout_progress
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = workout_progress.client_id
  ));

CREATE POLICY "Clients can update own workout progress" ON workout_progress
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = workout_progress.client_id
  ));

CREATE POLICY "Coaches can view client workout progress" ON workout_progress
  FOR SELECT USING (auth.uid() IN (
    SELECT trainer_id FROM clients WHERE id = workout_progress.client_id
  ));

CREATE POLICY "Coaches can update client workout progress" ON workout_progress
  FOR UPDATE USING (auth.uid() IN (
    SELECT trainer_id FROM clients WHERE id = workout_progress.client_id
  ));

-- Weight Tracking Policies
CREATE POLICY "Clients can manage own weight tracking" ON weight_tracking
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = weight_tracking.client_id
  ));

CREATE POLICY "Coaches can view client weight tracking" ON weight_tracking
  FOR SELECT USING (auth.uid() IN (
    SELECT trainer_id FROM clients WHERE id = weight_tracking.client_id
  ));

-- Client Goals Policies
CREATE POLICY "Clients can manage own goals" ON client_goals
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = client_goals.client_id
  ));

CREATE POLICY "Coaches can view and update client goals" ON client_goals
  FOR ALL USING (auth.uid() IN (
    SELECT trainer_id FROM clients WHERE id = client_goals.client_id
  ));

-- Exercise Goals Policies
CREATE POLICY "Clients can manage own exercise goals" ON exercise_goals
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = exercise_goals.client_id
  ));

CREATE POLICY "Coaches can view client exercise goals" ON exercise_goals
  FOR SELECT USING (auth.uid() IN (
    SELECT trainer_id FROM clients WHERE id = exercise_goals.client_id
  ));

-- Workout Completion Policies
CREATE POLICY "Clients can manage own completion" ON workout_completion
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = workout_completion.client_id
  ));

CREATE POLICY "Coaches can view client completion" ON workout_completion
  FOR SELECT USING (auth.uid() IN (
    SELECT trainer_id FROM clients WHERE id = workout_completion.client_id
  ));

-- Progress Milestones Policies
CREATE POLICY "Clients can view own milestones" ON progress_milestones
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM clients WHERE id = progress_milestones.client_id
  ));

CREATE POLICY "System can insert milestones" ON progress_milestones
  FOR INSERT WITH CHECK (true); -- Allow system to create milestones

-- Exercise Videos Policies (public read)
CREATE POLICY "Everyone can view exercise videos" ON exercise_videos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage exercise videos" ON exercise_videos
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'kersten@myarc.nl' -- Replace with your admin email
  ));

-- ===== FUNCTIONS =====

-- Function to calculate weekly streak
CREATE OR REPLACE FUNCTION calculate_weekly_streak(p_client_id UUID, p_target_workouts INTEGER DEFAULT 4)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_week_start DATE;
  v_week_end DATE;
  v_workout_count INTEGER;
BEGIN
  FOR i IN 0..51 LOOP -- Check last 52 weeks max
    v_week_start := date_trunc('week', CURRENT_DATE - (i * 7)::INTERVAL)::DATE;
    v_week_end := v_week_start + 6;
    
    SELECT COUNT(DISTINCT workout_date) INTO v_workout_count
    FROM workout_completion
    WHERE client_id = p_client_id
      AND workout_date BETWEEN v_week_start AND v_week_end
      AND completed = true;
    
    IF v_workout_count >= p_target_workouts THEN
      v_streak := v_streak + 1;
    ELSE
      EXIT; -- Streak broken
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to get progress statistics
CREATE OR REPLACE FUNCTION get_progress_stats(p_client_id UUID)
RETURNS TABLE (
  total_workouts INTEGER,
  current_weight DECIMAL,
  weight_target DECIMAL,
  weekly_target INTEGER,
  last_workout DATE,
  weekly_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM workout_completion WHERE client_id = p_client_id AND completed = true)::INTEGER as total_workouts,
    (SELECT weight FROM weight_tracking WHERE client_id = p_client_id ORDER BY date DESC LIMIT 1) as current_weight,
    (SELECT target_value FROM client_goals WHERE client_id = p_client_id AND goal_type = 'weight' LIMIT 1) as weight_target,
    COALESCE((SELECT target_value::INTEGER FROM client_goals WHERE client_id = p_client_id AND goal_type = 'weekly_workouts' LIMIT 1), 4) as weekly_target,
    (SELECT MAX(workout_date) FROM workout_completion WHERE client_id = p_client_id AND completed = true) as last_workout,
    calculate_weekly_streak(p_client_id) as weekly_streak;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGERS =====

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_progress_updated_at BEFORE UPDATE ON workout_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_goals_updated_at BEFORE UPDATE ON client_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_goals_updated_at BEFORE UPDATE ON exercise_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== SAMPLE DATA (Optional - Remove in production) =====

-- Insert some exercise videos
INSERT INTO exercise_videos (exercise_name, video_url) VALUES
  ('Barbell Bench Press', 'https://youtube.com/watch?v=rT7DgCr-3pg'),
  ('Lat Pulldown', 'https://youtube.com/watch?v=CAwf7n6Luuc'),
  ('Romanian Deadlift', 'https://youtube.com/watch?v=jEy_czb3RKA'),
  ('Leg Press', 'https://youtube.com/watch?v=IZxyjW7MPJQ'),
  ('Incline Dumbbell Press', 'https://youtube.com/watch?v=8iPEnn-ltC8')
ON CONFLICT (exercise_name) DO NOTHING;

-- ===== INDEXES FOR PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_workout_progress_date ON workout_progress(date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_date ON weight_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_completion_date ON workout_completion(workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_client ON progress_milestones(client_id, achieved_date DESC);

-- ===== GRANT PERMISSIONS =====

-- Grant necessary permissions to authenticated users
GRANT ALL ON workout_progress TO authenticated;
GRANT ALL ON weight_tracking TO authenticated;
GRANT ALL ON client_goals TO authenticated;
GRANT ALL ON exercise_goals TO authenticated;
GRANT ALL ON workout_completion TO authenticated;
GRANT ALL ON progress_milestones TO authenticated;
GRANT SELECT ON exercise_videos TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Progress module schema created successfully!';
END $$;
