-- Baptistini Advogados Gamification System Schema

-- 1. ENUMS (for strict typing)
CREATE TYPE user_tier AS ENUM ('Bronze', 'Silver', 'Gold', 'Diamond');
CREATE TYPE difficulty_level AS ENUM ('Light', 'Medium', 'Hard', 'Manual');
CREATE TYPE log_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- 2. PROFILES (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'Associate', -- Associate, Partner, Admin
  tier user_tier DEFAULT 'Bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ACTIVITY LOGS (The Core Ledger)
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Task Details
  activity_date DATE DEFAULT CURRENT_DATE,
  client_name TEXT NOT NULL,
  process_number TEXT, -- Optional (e.g., internal meetings don't have one)
  description TEXT NOT NULL,
  duration_minutes INTEGER, -- "Time Spent"
  
  -- Scoring Logic
  complexity difficulty_level NOT NULL,
  base_points INTEGER NOT NULL, -- 10 (Light), 25 (Medium), 50 (Hard)
  tier_multiplier DECIMAL(3, 2) DEFAULT 1.00, -- Snapshot of user tier at time of log (1x, 2x, 3x, 5x)
  final_points INTEGER GENERATED ALWAYS AS (base_points * tier_multiplier) STORED,
  
  -- Audit & Metadata
  is_bonus_penalty BOOLEAN DEFAULT FALSE, -- Tag for manual adjustments
  status log_status DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SCORING RULES (Configuration Table)
-- Allows changing point values without altering code
CREATE TABLE scoring_rules (
  id SERIAL PRIMARY KEY,
  level difficulty_level UNIQUE NOT NULL,
  points INTEGER NOT NULL
);

-- Seed Default Rules
INSERT INTO scoring_rules (level, points) VALUES
('Light', 10),
('Medium', 25),
('Hard', 50);
