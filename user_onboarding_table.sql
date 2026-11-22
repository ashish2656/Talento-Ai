-- Create user_onboarding table for the onboarding flow
-- Run this SQL command in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  age INTEGER,
  profession TEXT,
  year TEXT,
  location TEXT,
  company TEXT,
  experience INTEGER,
  career_level TEXT,
  usage TEXT[] DEFAULT '{}',
  usage_other TEXT,
  target_roles TEXT,
  industry TEXT,
  looking_for TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  technical_interests TEXT[] DEFAULT '{}',
  technical_other TEXT,
  resume_style TEXT,
  add_sections TEXT[] DEFAULT '{}',
  social_links TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_created_at ON user_onboarding(created_at DESC);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding data" ON user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON user_onboarding;
DROP POLICY IF EXISTS "Users can delete their own onboarding data" ON user_onboarding;

CREATE POLICY "Users can view their own onboarding data" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding data" ON user_onboarding
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
