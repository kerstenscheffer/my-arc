-- ============================================
-- MY ARC CHALLENGES SYSTEM - DATABASE SCHEMA
-- "Bet On Yourself" - 3 Challenges = Money Back
-- ============================================

-- 1. Challenge Templates (Pre-defined by coach)
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  category VARCHAR(50) NOT NULL, -- fitness, nutrition, mindset, transformation
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  
  -- Visual & UI
  gradient_start VARCHAR(7) DEFAULT '#ef4444', -- Red for challenges
  gradient_end VARCHAR(7) DEFAULT '#dc2626',
  accent_color VARCHAR(7) DEFAULT '#ef4444',
  
  -- Duration & Difficulty
  duration_days INTEGER NOT NULL,
  difficulty VARCHAR(20), -- beginner, gemiddeld, gevorderd, extreem
  
  -- Strategy & Implementation
  strategy_type VARCHAR(50), -- workout_plan, meal_plan, daily_habit, progress_tracking
  strategy_data JSONB, -- Complete workout/meal schedules, habits, etc
  
  -- Milestones (what to achieve)
  milestones JSONB DEFAULT '[]', -- Array of milestone objects with week/day targets
  
  -- Daily Targets (if applicable)
  daily_targets JSONB, -- e.g., {"monday": "5km run", "tuesday": "Upper body"}
  
  -- Verification & Rules
  verification_type VARCHAR(50), -- photo_proof, strava_connect, manual_entry, coach_approval
  verification_frequency VARCHAR(20), -- daily, weekly, milestone, end
  success_criteria JSONB,
  requires_baseline BOOLEAN DEFAULT false, -- Need baseline measurement first
  
  -- Points & Rewards
  base_points INTEGER DEFAULT 100,
  completion_bonus INTEGER DEFAULT 500,
  perfect_streak_bonus INTEGER DEFAULT 1000,
  daily_points INTEGER DEFAULT 10,
  
  -- Money Back Eligibility
  money_back_eligible BOOLEAN DEFAULT true,
  
  -- Statistics
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  avg_completion_days FLOAT,
  success_rate FLOAT DEFAULT 0,
  avg_rating FLOAT,
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Client Active Challenges
CREATE TABLE client_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id),
  
  -- Status & Progress
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, failed, abandoned
  progress_percentage INTEGER DEFAULT 0,
  
  -- Money Back Tracking
  is_money_back_challenge BOOLEAN DEFAULT false,
  money_back_number INTEGER, -- 1, 2, or 3
  money_back_amount DECIMAL(10,2), -- Amount to refund if completed
  
  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE,
  actual_end_date DATE,
  paused_date DATE,
  
  -- Progress Tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_active_days INTEGER DEFAULT 0,
  missed_days INTEGER DEFAULT 0,
  
  -- Milestones
  completed_milestones INTEGER DEFAULT 0,
  current_milestone_index INTEGER DEFAULT 0,
  milestone_progress JSONB DEFAULT '[]', -- Array tracking each milestone
  
  -- Daily Progress (for daily challenges)
  daily_checks JSONB DEFAULT '{}', -- {"2024-01-20": true, "2024-01-21": false}
  weekly_summaries JSONB DEFAULT '[]', -- Weekly performance data
  
  -- Integration with other systems
  linked_workout_schema_id UUID,
  linked_meal_plan_id UUID,
  
  -- Points Earned
  points_earned INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  
  -- Notes & Motivation
  client_notes TEXT,
  motivation_reason TEXT,
  coach_notes TEXT,
  
  -- Verification
  last_verified_date DATE,
  verification_data JSONB DEFAULT '{}', -- Store photos, measurements, etc
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Challenge Milestones (Detailed progress markers)
CREATE TABLE challenge_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_challenge_id UUID REFERENCES client_challenges(id) ON DELETE CASCADE,
  milestone_index INTEGER,
  
  -- Milestone Details
  title VARCHAR(200),
  description TEXT,
  target_value DECIMAL(10,2), -- e.g., 5 (kg), 10 (km), etc
  current_value DECIMAL(10,2),
  unit VARCHAR(20), -- kg, km, minutes, reps, etc
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  completed_date DATE,
  
  -- Points
  points_value INTEGER DEFAULT 50,
  points_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Challenge Daily Logs (For daily habit tracking)
CREATE TABLE challenge_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_challenge_id UUID REFERENCES client_challenges(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Completion
  completed BOOLEAN DEFAULT false,
  completed_time TIME,
  
  -- Details (varies by challenge type)
  workout_completed BOOLEAN,
  meal_plan_followed BOOLEAN,
  water_intake INTEGER, -- glasses
  steps_count INTEGER,
  sleep_hours DECIMAL(3,1),
  
  -- Custom metrics
  custom_metrics JSONB DEFAULT '{}',
  
  -- Verification
  photo_url TEXT,
  notes TEXT,
  coach_verified BOOLEAN DEFAULT false,
  
  -- Points
  points_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_challenge_id, log_date)
);

-- 5. Challenge Leaderboard
CREATE TABLE challenge_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id),
  client_id UUID REFERENCES clients(id),
  
  -- Ranking Data
  rank INTEGER,
  total_points INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  
  -- Performance
  milestones_completed INTEGER DEFAULT 0,
  perfect_weeks INTEGER DEFAULT 0,
  
  -- Updated regularly
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(challenge_id, client_id)
);

-- 6. Challenge Templates Library (Pre-made by MY ARC)
CREATE TABLE challenge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  template_name VARCHAR(100),
  category VARCHAR(50),
  tags TEXT[], -- Array of tags for searching
  
  -- Complete Template Data
  template_data JSONB, -- Full challenge configuration
  
  -- Usage
  times_used INTEGER DEFAULT 0,
  avg_success_rate FLOAT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Challenge Rewards & Badges
CREATE TABLE challenge_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  challenge_id UUID REFERENCES challenges(id),
  
  -- Reward Type
  reward_type VARCHAR(50), -- badge, points, discount, bonus_content
  reward_value JSONB,
  
  -- Badge Specific
  badge_name VARCHAR(100),
  badge_icon VARCHAR(50),
  badge_color VARCHAR(7),
  
  earned_date TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, challenge_id, reward_type)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_client_challenges_status ON client_challenges(status);
CREATE INDEX idx_client_challenges_client ON client_challenges(client_id);
CREATE INDEX idx_client_challenges_money_back ON client_challenges(is_money_back_challenge);
CREATE INDEX idx_daily_logs_date ON challenge_daily_logs(log_date);
CREATE INDEX idx_daily_logs_client_challenge ON challenge_daily_logs(client_challenge_id);
CREATE INDEX idx_leaderboard_challenge ON challenge_leaderboard(challenge_id);
CREATE INDEX idx_leaderboard_rank ON challenge_leaderboard(rank);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_rewards ENABLE ROW LEVEL SECURITY;

-- Clients can see all challenges
CREATE POLICY "Clients can view challenges" ON challenges
  FOR SELECT USING (true);

-- Clients can only see their own challenge data
CREATE POLICY "Clients can view own challenges" ON client_challenges
  FOR SELECT USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can update own challenges" ON client_challenges
  FOR UPDATE USING (auth.uid()::text = client_id::text);

CREATE POLICY "Clients can insert own challenges" ON client_challenges
  FOR INSERT WITH CHECK (auth.uid()::text = client_id::text);

-- Similar policies for other tables
CREATE POLICY "Clients can manage own logs" ON challenge_daily_logs
  FOR ALL USING (
    client_challenge_id IN (
      SELECT id FROM client_challenges 
      WHERE client_id = auth.uid()::uuid
    )
  );

-- ============================================
-- SEED DATA - Example Challenges
-- ============================================
INSERT INTO challenges (category, slug, name, subtitle, description, duration_days, difficulty, strategy_type, milestones, daily_targets, verification_type, base_points, completion_bonus) VALUES
-- Fitness Challenges
('fitness', 'run-sneller-5k', '⚡ Speed Demon 5K', 'Verbeter je 5K tijd met 2 minuten in 30 dagen', 'Transformeer je loopsnelheid met ons bewezen interval training programma.', 30, 'gemiddeld', 'workout_plan', 
'[
  {"week": 1, "title": "Basislijn Test", "description": "Loop 5K op comfortabel tempo"},
  {"week": 2, "title": "Interval Introductie", "description": "3x 1km intervallen op doeltempo"},
  {"week": 3, "title": "Snelheid Uithoudingsvermogen", "description": "5x 800m op wedstrijdtempo"},
  {"week": 4, "title": "Eindtijd Test", "description": "Nieuwe 5K PR poging"}
]'::jsonb,
'{
  "maandag": "Rustige 5km loop",
  "dinsdag": "Interval training: 6x400m",
  "woensdag": "Rust of yoga",
  "donderdag": "Tempo run 3km",
  "vrijdag": "Rust",
  "zaterdag": "Lange duurloop 8-10km",
  "zondag": "Herstelloop 3km"
}'::jsonb,
'strava_connect', 200, 1000),

('fitness', 'kracht-bouwer', '💪 Kracht Revolutie', 'Verhoog je squat met 20kg in 60 dagen', 'Progressief overload programma voor maximale krachttoename.', 60, 'gemiddeld', 'workout_plan',
'[
  {"week": 2, "title": "Vorm Check", "description": "+5kg met perfecte vorm"},
  {"week": 4, "title": "Eerste Mijlpaal", "description": "+10kg bereikt"},
  {"week": 6, "title": "Barrières Doorbreken", "description": "+15kg bereikt"},
  {"week": 8, "title": "Einddoel", "description": "+20kg BEHAALD!"}
]'::jsonb,
null, 'video_bewijs', 250, 1500),

-- Nutrition Challenges  
('voeding', 'schoon-eten-30', '🥗 Schoon 30', '30 dagen alleen onbewerkte voeding', 'Eet 30 dagen lang alleen verse, onbewerkte voeding. Transformeer je energie!', 30, 'beginner', 'maaltijd_plan',
'[
  {"day": 7, "title": "Week 1 Voltooid", "description": "Eerste week suikervrij!"},
  {"day": 14, "title": "Halverwege", "description": "Energieniveau stijgt"},
  {"day": 21, "title": "Gewoonte Gevormd", "description": "Schoon eten voelt natuurlijk"},
  {"day": 30, "title": "Challenge Meester", "description": "30 dagen voltooid!"}
]'::jsonb,
null, 'foto_bewijs', 150, 750),

('voeding', 'water-krijger', '💧 Hydratatie Held', 'Drink 3L water per dag voor 30 dagen', 'Beheers je hydratatie en voel de energie boost.', 30, 'beginner', 'dagelijkse_gewoonte',
'[
  {"day": 7, "title": "Routine Gezet", "description": "Eerste week consistent"},
  {"day": 14, "title": "Fris Gevoel", "description": "Huid gloeit, energie stijgt"},
  {"day": 21, "title": "Gewoonte Meester", "description": "Automatisch 3L per dag"},
  {"day": 30, "title": "Hydratatie Held", "description": "Challenge voltooid!"}
]'::jsonb,
null, 'handmatige_invoer', 100, 500),

-- Mindset Challenges
('mindset', '5am-club', '🌅 5AM Club', 'Word 30 dagen voor 5:30 wakker', 'Word lid van de 5AM club en win je ochtend, win je dag.', 30, 'gevorderd', 'dagelijkse_gewoonte',
'[
  {"day": 3, "title": "Eerste Mijlpaal", "description": "3 dagen consistent"},
  {"day": 7, "title": "Week Krijger", "description": "Hele week vroeg op"},
  {"day": 21, "title": "Gewoonte Gevormd", "description": "Biologische klok aangepast"},
  {"day": 30, "title": "5AM Meester", "description": "Je beheerst je ochtenden!"}
]'::jsonb,
null, 'foto_bewijs', 200, 1000),

-- Transformation Challenges
('transformatie', 'verlies-5kg', '🔥 Verbrand 5KG', 'Verlies 5kg in 60 dagen op gezonde wijze', 'Duurzaam gewichtsverlies met onze bewezen methode.', 60, 'gemiddeld', 'gecombineerd',
'[
  {"week": 2, "title": "-1kg", "description": "Eerste kilo weg!"},
  {"week": 4, "title": "-2.5kg", "description": "Halverwege het doel"},
  {"week": 6, "title": "-4kg", "description": "Bijna daar!"},
  {"week": 8, "title": "-5kg", "description": "DOEL BEREIKT!"}
]'::jsonb,
null, 'coach_goedkeuring', 300, 2000),

('transformatie', 'spier-massa', '💪 Massa Bouwer', 'Bouw 3kg spiermassa in 90 dagen', 'Wetenschappelijk onderbouwd programma voor maximale spiergroei.', 90, 'gevorderd', 'gecombineerd',
'[
  {"week": 4, "title": "+1kg", "description": "Eerste kg spier toegevoegd"},
  {"week": 8, "title": "+2kg", "description": "Zichtbare groei"},
  {"week": 12, "title": "+3kg", "description": "Doel bereikt!"}
]'::jsonb,
null, 'coach_goedkeuring', 400, 2500);
