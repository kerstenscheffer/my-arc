-- ========================================
-- COMPLETE GOALS SYSTEM DATABASE SCHEMA
-- Voor MY ARC Fitness Coaching Platform
-- ========================================

-- 1. UPDATE client_goals table met alle nieuwe velden
ALTER TABLE client_goals 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS main_category VARCHAR(50), -- herstel/mindset/workout/voeding/structuur
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50),
ADD COLUMN IF NOT EXISTS measurement_type VARCHAR(50) DEFAULT 'number',
ADD COLUMN IF NOT EXISTS measurement_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progress_data JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS frequency VARCHAR(50),
ADD COLUMN IF NOT EXISTS frequency_target INTEGER,
ADD COLUMN IF NOT EXISTS category VARCHAR(50), -- legacy support
ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_time TIME,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'target',
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS expected_duration_weeks INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS start_value DECIMAL(10,2);

-- 2. CREATE goal_progress table
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES client_goals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value DECIMAL(10,2),
  checked BOOLEAN DEFAULT false,
  photo_urls TEXT[],
  notes TEXT,
  duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(goal_id, date)
);

-- 3. CREATE enhanced goal_templates table
CREATE TABLE IF NOT EXISTS goal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  main_category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  description TEXT,
  goal_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  measurement_type VARCHAR(50) NOT NULL,
  default_target DECIMAL(10,2),
  default_duration_days INTEGER DEFAULT 30,
  unit VARCHAR(50),
  frequency VARCHAR(50),
  frequency_target INTEGER,
  measurement_config JSONB DEFAULT '{}',
  icon VARCHAR(50),
  color VARCHAR(7),
  is_public BOOLEAN DEFAULT true,
  coach_recommended BOOLEAN DEFAULT false,
  difficulty_level VARCHAR(20) DEFAULT 'beginner',
  expected_duration_weeks INTEGER DEFAULT 4,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. CREATE goal_milestones table for journey system
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES client_goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_value DECIMAL(10,2),
  unit VARCHAR(50),
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_date DATE,
  order_index INTEGER DEFAULT 0,
  icon VARCHAR(50) DEFAULT 'flag',
  percentage INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. CREATE goal_actions table for daily habits
CREATE TABLE IF NOT EXISTS goal_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES client_goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) DEFAULT 'weekly',
  frequency_target INTEGER DEFAULT 3,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed DATE,
  icon VARCHAR(50) DEFAULT 'zap',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. CREATE goal_action_logs table for tracking
CREATE TABLE IF NOT EXISTS goal_action_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID REFERENCES goal_actions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(action_id, date)
);

-- 7. INSERT categorized goal templates
INSERT INTO goal_templates (name, main_category, subcategory, description, measurement_type, default_target, unit, icon, color, coach_recommended, difficulty_level, expected_duration_weeks) VALUES
-- HERSTEL CATEGORY
('8 Uur Slaap Routine', 'herstel', 'Slaap', 'Elke nacht 8 uur quality sleep', 'timer', 8, 'uur', 'moon', '#60a5fa', true, 'beginner', 4),
('Screen-Free Evening', 'herstel', 'Slaap', '1 uur voor bed geen schermen', 'checkbox', 7, 'dagen/week', 'smartphone', '#60a5fa', true, 'beginner', 3),
('Morning Stretch Routine', 'herstel', 'Stretching', '10 minuten ochtend stretching', 'timer', 10, 'minuten', 'activity', '#60a5fa', true, 'beginner', 2),
('Daily Foam Rolling', 'herstel', 'Recovery', 'Dagelijks foam roll routine', 'checkbox', 5, 'dagen/week', 'circle', '#60a5fa', false, 'intermediate', 4),
('Power Nap Master', 'herstel', 'Slaap', '20 min power nap dagelijks', 'timer', 20, 'minuten', 'battery', '#60a5fa', false, 'intermediate', 3),
('Deep Breathing', 'herstel', 'Breathwork', '5 min ademhalingsoefeningen', 'timer', 5, 'minuten', 'wind', '#60a5fa', true, 'beginner', 2),
('Ice Bath Recovery', 'herstel', 'Recovery', 'Wekelijkse ice bath', 'checkbox', 2, 'keer/week', 'droplets', '#60a5fa', false, 'advanced', 6),
('Yoga Flow', 'herstel', 'Stretching', '30 min yoga sessie', 'timer', 30, 'minuten', 'activity', '#60a5fa', true, 'intermediate', 4),

-- MINDSET CATEGORY
('Morning Pages', 'mindset', 'Journaling', '3 paginas schrijven elke ochtend', 'checkbox', 7, 'dagen/week', 'book', '#ef4444', true, 'beginner', 4),
('Meditation Streak', 'mindset', 'Meditatie', 'Dagelijks 15 min mediteren', 'timer', 15, 'minuten', 'brain', '#ef4444', true, 'beginner', 6),
('Gratitude Practice', 'mindset', 'Motivatie', '3 dingen dankbaar voor schrijven', 'checkbox', 7, 'dagen/week', 'heart', '#ef4444', true, 'beginner', 3),
('Cold Shower Challenge', 'mindset', 'Discipline', 'Koude douche elke dag', 'checkbox', 5, 'dagen/week', 'droplets', '#ef4444', false, 'intermediate', 4),
('Visualization Practice', 'mindset', 'Visualisatie', '10 min doelen visualiseren', 'timer', 10, 'minuten', 'eye', '#ef4444', false, 'intermediate', 4),
('No Complaint Week', 'mindset', 'Discipline', 'Week zonder klagen', 'checkbox', 7, 'dagen/week', 'smile', '#ef4444', false, 'advanced', 2),
('Focus Blocks', 'mindset', 'Focus', '90 min deep work sessies', 'timer', 90, 'minuten', 'target', '#ef4444', true, 'intermediate', 6),
('Affirmations', 'mindset', 'Motivatie', 'Dagelijkse affirmaties', 'checkbox', 7, 'dagen/week', 'star', '#ef4444', false, 'beginner', 3),

-- WORKOUT CATEGORY
('Bench Press 100kg', 'workout', 'Kracht', 'Bench press milestone bereiken', 'number', 100, 'kg', 'dumbbell', '#f59e0b', true, 'intermediate', 12),
('5K Under 25 Minutes', 'workout', 'Cardio', 'Run 5K in 25 minuten', 'timer', 25, 'minuten', 'run', '#f59e0b', true, 'intermediate', 8),
('10K Steps Daily', 'workout', 'Cardio', 'Dagelijks 10.000 stappen', 'counter', 10000, 'stappen', 'footprints', '#f59e0b', true, 'beginner', 4),
('20 Pull-ups', 'workout', 'Skills', '20 pull-ups in één set', 'counter', 20, 'reps', 'activity', '#f59e0b', false, 'advanced', 12),
('Handstand Hold', 'workout', 'Skills', '60 sec handstand vasthouden', 'timer', 60, 'seconden', 'activity', '#f59e0b', false, 'advanced', 16),
('Marathon Training', 'workout', 'Cardio', 'Marathon in 4 uur', 'timer', 240, 'minuten', 'trophy', '#f59e0b', false, 'advanced', 20),
('Squat 2x Bodyweight', 'workout', 'Kracht', 'Squat 2x lichaamsgewicht', 'number', 160, 'kg', 'dumbbell', '#f59e0b', false, 'advanced', 16),
('Plank 5 Minutes', 'workout', 'Core', '5 minuten plank hold', 'timer', 5, 'minuten', 'activity', '#f59e0b', true, 'intermediate', 8),
('100 Burpees', 'workout', 'Cardio', '100 burpees challenge', 'counter', 100, 'reps', 'zap', '#f59e0b', false, 'advanced', 6),
('Flexibility Split', 'workout', 'Mobility', 'Full split bereiken', 'photos', 1, 'milestone', 'activity', '#f59e0b', false, 'advanced', 20),

-- VOEDING CATEGORY
('2L Water Daily', 'voeding', 'Hydratatie', 'Drink 2 liter water per dag', 'counter', 8, 'glazen', 'droplets', '#10b981', true, 'beginner', 3),
('Protein Target 150g', 'voeding', 'Macros', 'Hit dagelijkse protein doel', 'number', 150, 'gram', 'beef', '#10b981', true, 'intermediate', 4),
('No Junk Food Week', 'voeding', 'Discipline', 'Week zonder junk food', 'checkbox', 7, 'dagen/week', 'pizza', '#10b981', true, 'beginner', 2),
('Meal Prep Sunday', 'voeding', 'Meal Prep', 'Wekelijks meals preppen', 'checkbox', 1, 'keer/week', 'chefHat', '#10b981', false, 'beginner', 4),
('16:8 Fasting', 'voeding', 'Routine', '16 uur vasten window', 'timer', 16, 'uur', 'clock', '#10b981', false, 'intermediate', 6),
('5 Porties Groente', 'voeding', 'Gezondheid', '5 porties groente/fruit', 'counter', 5, 'porties', 'apple', '#10b981', true, 'beginner', 3),
('No Sugar Challenge', 'voeding', 'Discipline', '30 dagen geen toegevoegde suiker', 'checkbox', 30, 'dagen', 'candy', '#10b981', false, 'advanced', 4),
('Calorie Tracking', 'voeding', 'Calorieën', 'Track alle calorieën', 'checkbox', 7, 'dagen/week', 'calculator', '#10b981', true, 'beginner', 4),
('Supplement Routine', 'voeding', 'Supplementen', 'Dagelijkse supplementen', 'checkbox', 7, 'dagen/week', 'pill', '#10b981', false, 'beginner', 4),

-- STRUCTUUR CATEGORY
('Morning Routine', 'structuur', 'Routine', 'Vaste ochtend routine', 'checkbox', 7, 'dagen/week', 'sunrise', '#8b5cf6', true, 'beginner', 3),
('Weekly Planning', 'structuur', 'Planning', 'Zondag week plannen', 'checkbox', 1, 'keer/week', 'calendar', '#8b5cf6', true, 'beginner', 4),
('No Snooze Challenge', 'structuur', 'Discipline', 'Opstaan zonder snooze', 'checkbox', 7, 'dagen/week', 'alarm', '#8b5cf6', true, 'intermediate', 3),
('Digital Detox', 'structuur', 'Focus', '2 uur geen telefoon', 'timer', 2, 'uur', 'smartphone', '#8b5cf6', false, 'intermediate', 4),
('Evening Shutdown', 'structuur', 'Routine', 'Werk stoppen om 18:00', 'checkbox', 5, 'dagen/week', 'power', '#8b5cf6', false, 'intermediate', 4),
('Time Blocking', 'structuur', 'Planning', 'Dag in blokken plannen', 'checkbox', 5, 'dagen/week', 'clock', '#8b5cf6', true, 'intermediate', 6),
('Inbox Zero', 'structuur', 'Productivity', 'Email inbox leeg', 'checkbox', 5, 'dagen/week', 'inbox', '#8b5cf6', false, 'advanced', 4),
('5AM Club', 'structuur', 'Routine', 'Opstaan om 5:00', 'checkbox', 5, 'dagen/week', 'sun', '#8b5cf6', false, 'advanced', 8),
('Pomodoro Technique', 'structuur', 'Focus', '8 pomodoros per dag', 'counter', 8, 'sessies', 'timer', '#8b5cf6', true, 'beginner', 3),
('Weekly Review', 'structuur', 'Planning', 'Wekelijkse review sessie', 'checkbox', 1, 'keer/week', 'clipboard', '#8b5cf6', true, 'intermediate', 4)
ON CONFLICT DO NOTHING;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(goal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON goal_templates(main_category, subcategory);
CREATE INDEX IF NOT EXISTS idx_goal_templates_recommended ON goal_templates(coach_recommended, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id, order_index);
CREATE INDEX IF NOT EXISTS idx_goal_actions_goal_id ON goal_actions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_action_logs_action_date ON goal_action_logs(action_id, date DESC);

-- 9. Enable RLS (Row Level Security)
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_action_logs ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
-- Goal Progress
CREATE POLICY "Users can manage their own goal progress" ON goal_progress
FOR ALL USING (auth.uid() = client_id);

-- Goal Templates
CREATE POLICY "Everyone can view public goal templates" ON goal_templates
FOR SELECT USING (is_public = true);

CREATE POLICY "Coaches can manage goal templates" ON goal_templates
FOR ALL USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'coach'
));

-- Goal Milestones
CREATE POLICY "Users can manage their goal milestones" ON goal_milestones
FOR ALL USING (EXISTS (
  SELECT 1 FROM client_goals 
  WHERE client_goals.id = goal_milestones.goal_id 
  AND client_goals.client_id = auth.uid()
));

-- Goal Actions
CREATE POLICY "Users can manage their goal actions" ON goal_actions
FOR ALL USING (EXISTS (
  SELECT 1 FROM client_goals 
  WHERE client_goals.id = goal_actions.goal_id 
  AND client_goals.client_id = auth.uid()
));

-- Goal Action Logs
CREATE POLICY "Users can manage their action logs" ON goal_action_logs
FOR ALL USING (EXISTS (
  SELECT 1 FROM goal_actions
  JOIN client_goals ON client_goals.id = goal_actions.goal_id
  WHERE goal_actions.id = goal_action_logs.action_id
  AND client_goals.client_id = auth.uid()
));

-- 11. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Complete Goals System successfully installed!';
  RAISE NOTICE '📊 5 main categories: Herstel, Mindset, Workout, Voeding, Structuur';
  RAISE NOTICE '🎯 Added %s goal templates across all categories', (SELECT COUNT(*) FROM goal_templates);
  RAISE NOTICE '🚀 Journey system with milestones and actions ready';
  RAISE NOTICE '🔒 Row Level Security enabled for all tables';
END $$;
