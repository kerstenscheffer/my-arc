-- ===== CHALLENGE SYSTEM DATABASE SCHEMA =====
-- Voeg deze tabellen toe aan je Supabase database
-- Integreert met bestaande goals system

-- 1. CHALLENGES - Master challenge definition
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Challenge Basics
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'running', 'nutrition', 'sleep', 'mindset', 'workout', 'lifestyle'
  
  -- Template Info
  is_template BOOLEAN DEFAULT FALSE,
  template_name VARCHAR(255),
  
  -- Timeline
  default_duration_weeks INTEGER NOT NULL DEFAULT 4,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 2. CHALLENGE_STRATEGY - Week by week plan
CREATE TABLE challenge_strategy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  
  -- Week Details
  week_number INTEGER NOT NULL,
  week_title VARCHAR(255) NOT NULL,
  week_description TEXT,
  
  -- Week Goals
  primary_target VARCHAR(255) NOT NULL, -- "3x 10km runs"
  target_value DECIMAL(10,2),
  target_unit VARCHAR(50),
  frequency_target INTEGER DEFAULT 3, -- times per week
  
  -- Checkpoints
  checkpoint_title VARCHAR(255), -- "Nu zou je 5:10 pace moeten kunnen"
  checkpoint_description TEXT,
  checkpoint_type VARCHAR(50) DEFAULT 'performance', -- 'performance', 'consistency', 'milestone'
  
  -- Additional metrics
  secondary_targets JSONB, -- [{"type": "sleep", "value": 8, "unit": "hours"}]
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CLIENT_CHALLENGES - Assigned challenges to clients
CREATE TABLE client_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Assignment Details
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE GENERATED ALWAYS AS (start_date + INTERVAL '1 day' * (
    SELECT default_duration_weeks * 7 FROM challenges WHERE challenges.id = challenge_id
  )) STORED,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  
  -- Progress
  current_week INTEGER DEFAULT 1,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Customization (can override strategy)
  custom_strategy JSONB, -- Override default strategy if needed
  
  -- Tracking
  assigned_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_progress_update TIMESTAMP
);

-- 4. CHALLENGE_PROGRESS - Track weekly progress
CREATE TABLE challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_challenge_id UUID REFERENCES client_challenges(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  
  -- Progress Data
  target_achieved BOOLEAN DEFAULT FALSE,
  actual_value DECIMAL(10,2),
  target_value DECIMAL(10,2),
  
  -- Checkpoint Results
  checkpoint_passed BOOLEAN DEFAULT FALSE,
  checkpoint_notes TEXT,
  coach_feedback TEXT,
  
  -- Weekly Metrics
  consistency_score INTEGER, -- 0-100, how many times hit target
  week_rating INTEGER, -- 1-5, client self-assessment
  notes TEXT,
  
  -- Timestamps
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. CHALLENGE_TEMPLATES - Prebuilt challenge strategies  
CREATE TABLE challenge_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  
  -- Template Structure
  duration_weeks INTEGER NOT NULL,
  strategy_data JSONB NOT NULL, -- Complete week-by-week strategy
  
  -- Meta
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0, -- % of clients who complete
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. CHALLENGE_ACTIONS - Daily/weekly actions within challenge
CREATE TABLE challenge_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_strategy_id UUID REFERENCES challenge_strategy(id) ON DELETE CASCADE,
  
  -- Action Details
  action_title VARCHAR(255) NOT NULL,
  action_description TEXT,
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'custom'
  frequency_target INTEGER NOT NULL, -- how many times
  
  -- Action Type
  action_type VARCHAR(50) NOT NULL, -- 'workout', 'nutrition', 'sleep', 'mindset', 'recovery'
  measurement_type VARCHAR(20) DEFAULT 'checkbox', -- 'checkbox', 'number', 'timer'
  
  -- Target Values
  target_value DECIMAL(10,2),
  unit VARCHAR(50),
  
  -- Order
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. CLIENT_CHALLENGE_ACTIONS - Track action completions
CREATE TABLE client_challenge_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_challenge_id UUID REFERENCES client_challenges(id) ON DELETE CASCADE,
  challenge_action_id UUID REFERENCES challenge_actions(id) ON DELETE CASCADE,
  
  -- Completion Tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  value DECIMAL(10,2), -- actual value achieved
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_challenge_id, challenge_action_id, date)
);

-- RLS Policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_strategy ENABLE ROW LEVEL SECURITY;  
ALTER TABLE client_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_challenge_actions ENABLE ROW LEVEL SECURITY;

-- Policies for coaches (can manage their challenges)
CREATE POLICY "coaches_manage_challenges" ON challenges
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "coaches_manage_strategy" ON challenge_strategy
  FOR ALL USING (
    EXISTS (SELECT 1 FROM challenges WHERE challenges.id = challenge_strategy.challenge_id AND challenges.coach_id = auth.uid())
  );

CREATE POLICY "coaches_manage_client_challenges" ON client_challenges
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "coaches_view_progress" ON challenge_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM client_challenges WHERE client_challenges.id = challenge_progress.client_challenge_id AND client_challenges.coach_id = auth.uid())
  );

-- Policies for clients (can view their challenges)
CREATE POLICY "clients_view_their_challenges" ON client_challenges
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_track_progress" ON challenge_progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM client_challenges WHERE client_challenges.id = challenge_progress.client_challenge_id AND client_challenges.client_id = auth.uid())
  );

CREATE POLICY "clients_track_actions" ON client_challenge_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM client_challenges WHERE client_challenges.id = client_challenge_actions.client_challenge_id AND client_challenges.client_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_challenges_coach ON challenges(coach_id);
CREATE INDEX idx_client_challenges_client ON client_challenges(client_id);
CREATE INDEX idx_client_challenges_coach ON client_challenges(coach_id);
CREATE INDEX idx_challenge_progress_week ON challenge_progress(client_challenge_id, week_number);
CREATE INDEX idx_challenge_actions_date ON client_challenge_actions(client_challenge_id, date);

-- Sample data
INSERT INTO challenge_templates (name, description, category, duration_weeks, strategy_data, is_public) VALUES
(
  '20KM Hardloop Challenge',
  '4 weken progressief hardloop programma naar 20km',
  'running',
  4,
  '{
    "weeks": [
      {
        "week": 1,
        "title": "Base Building",
        "targets": [
          {"type": "run", "frequency": 3, "distance": 5, "pace": "6:00", "unit": "km"}
        ],
        "checkpoint": "Je zou 5km makkelijk moeten kunnen lopen in 6:00 pace"
      },
      {
        "week": 2, 
        "title": "Distance Increase",
        "targets": [
          {"type": "run", "frequency": 3, "distance": 8, "pace": "5:50", "unit": "km"}
        ],
        "checkpoint": "8km in 5:50 pace moet nu goed voelen"
      },
      {
        "week": 3,
        "title": "Speed Development", 
        "targets": [
          {"type": "run", "frequency": 3, "distance": 12, "pace": "5:40", "unit": "km"}
        ],
        "checkpoint": "12km in 5:40 - je conditie is flink verbeterd"
      },
      {
        "week": 4,
        "title": "Final Push",
        "targets": [
          {"type": "run", "frequency": 2, "distance": 20, "pace": "5:30", "unit": "km"}
        ],
        "checkpoint": "20KM DOEL BEHAALD! Je bent een machine geworden"
      }
    ]
  }'::jsonb,
  TRUE
);

-- Function to convert challenge to goals (integration with existing system)
CREATE OR REPLACE FUNCTION create_goals_from_challenge(
  p_client_challenge_id UUID
) RETURNS VOID AS $$
DECLARE
  challenge_record RECORD;
  strategy_record RECORD;
  goal_id UUID;
BEGIN
  -- Get challenge info
  SELECT cc.*, c.title, c.description, c.category
  FROM client_challenges cc
  JOIN challenges c ON c.id = cc.challenge_id
  WHERE cc.id = p_client_challenge_id
  INTO challenge_record;
  
  -- Create main goal
  INSERT INTO client_goals (
    client_id,
    title,
    goal_type,
    category,
    main_category,
    target_value,
    current_value,
    target_date,
    status,
    frequency,
    frequency_target,
    notes,
    challenge_id
  ) VALUES (
    challenge_record.client_id,
    challenge_record.title,
    'challenge',
    challenge_record.category,
    challenge_record.category,
    100, -- percentage completion
    0,
    challenge_record.end_date,
    'active',
    'weekly',
    3,
    challenge_record.description,
    challenge_record.challenge_id
  ) RETURNING id INTO goal_id;
  
  -- Create milestone for each week
  FOR strategy_record IN 
    SELECT * FROM challenge_strategy 
    WHERE challenge_id = challenge_record.challenge_id 
    ORDER BY week_number
  LOOP
    INSERT INTO goal_milestones (
      goal_id,
      title,
      target_value,
      unit,
      target_date,
      order_index,
      icon
    ) VALUES (
      goal_id,
      strategy_record.checkpoint_title,
      strategy_record.target_value,
      strategy_record.target_unit,
      challenge_record.start_date + INTERVAL '1 week' * strategy_record.week_number,
      strategy_record.week_number,
      'flag'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE challenges IS 'Master challenge definitions created by coaches';
COMMENT ON TABLE challenge_strategy IS 'Week-by-week strategy for each challenge';  
COMMENT ON TABLE client_challenges IS 'Challenges assigned to specific clients';
COMMENT ON TABLE challenge_progress IS 'Weekly progress tracking for client challenges';
COMMENT ON TABLE challenge_templates IS 'Reusable challenge templates';
COMMENT ON TABLE challenge_actions IS 'Daily/weekly actions within challenge weeks';
COMMENT ON TABLE client_challenge_actions IS 'Completion tracking for challenge actions';
