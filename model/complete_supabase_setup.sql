-- Run this entire script in Supabase SQL Editor.
-- It is safe to rerun.

CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  job_role TEXT,
  score DECIMAL(5,2) NOT NULL,
  level TEXT,
  number_of_questions INTEGER,
  correct_answers INTEGER DEFAULT 0,
  time_taken INTEGER,
  questions_data JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  job_role TEXT,
  total_assessments INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  best_score DECIMAL(5,2) DEFAULT 0,
  improvement_rate DECIMAL(5,2) DEFAULT 0,
  last_assessment_date TIMESTAMP WITH TIME ZONE,
  streak_count INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_type, job_role)
);

CREATE TABLE IF NOT EXISTS public.assessment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  level TEXT,
  number_of_questions INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_type ON public.assessment_results(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_results_completed ON public.assessment_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_type ON public.user_progress(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_history_user_id ON public.assessment_history(user_id);

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assessment results" ON public.assessment_results;
CREATE POLICY "Users can view their own assessment results" ON public.assessment_results
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own assessment results" ON public.assessment_results;
CREATE POLICY "Users can insert their own assessment results" ON public.assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own user progress" ON public.user_progress;
CREATE POLICY "Users can view their own user progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own user progress" ON public.user_progress;
CREATE POLICY "Users can insert their own user progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own user progress" ON public.user_progress;
CREATE POLICY "Users can update their own user progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own assessment history" ON public.assessment_history;
CREATE POLICY "Users can view their own assessment history" ON public.assessment_history
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own assessment history" ON public.assessment_history;
CREATE POLICY "Users can insert their own assessment history" ON public.assessment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_user_progress()
RETURNS TRIGGER AS $$
DECLARE
  previous_score DECIMAL(5,2);
BEGIN
  SELECT score INTO previous_score
  FROM public.assessment_results
  WHERE user_id = NEW.user_id
    AND assessment_type = NEW.assessment_type
    AND job_role IS NOT DISTINCT FROM NEW.job_role
    AND id != NEW.id
  ORDER BY completed_at DESC
  LIMIT 1;

  INSERT INTO public.user_progress (
    user_id,
    assessment_type,
    job_role,
    total_assessments,
    total_questions,
    total_correct,
    average_score,
    best_score,
    improvement_rate,
    last_assessment_date,
    total_time_spent,
    updated_at
  ) VALUES (
    NEW.user_id,
    NEW.assessment_type,
    NEW.job_role,
    1,
    COALESCE(NEW.number_of_questions, 0),
    COALESCE(NEW.correct_answers, 0),
    NEW.score,
    NEW.score,
    CASE WHEN previous_score IS NULL THEN 0 ELSE NEW.score - previous_score END,
    NEW.completed_at,
    COALESCE(NEW.time_taken, 0),
    NOW()
  )
  ON CONFLICT (user_id, assessment_type, job_role)
  DO UPDATE SET
    total_assessments = public.user_progress.total_assessments + 1,
    total_questions = public.user_progress.total_questions + COALESCE(NEW.number_of_questions, 0),
    total_correct = public.user_progress.total_correct + COALESCE(NEW.correct_answers, 0),
    average_score = ROUND(((public.user_progress.average_score * public.user_progress.total_assessments) + NEW.score) /
      (public.user_progress.total_assessments + 1), 2),
    best_score = GREATEST(public.user_progress.best_score, NEW.score),
    improvement_rate = CASE WHEN previous_score IS NULL THEN 0 ELSE NEW.score - previous_score END,
    last_assessment_date = NEW.completed_at,
    total_time_spent = public.user_progress.total_time_spent + COALESCE(NEW.time_taken, 0),
    updated_at = NOW();

  INSERT INTO public.assessment_history (
    user_id,
    assessment_type,
    score,
    level,
    number_of_questions,
    completed_at
  ) VALUES (
    NEW.user_id,
    NEW.assessment_type,
    NEW.score,
    NEW.level,
    NEW.number_of_questions,
    NEW.completed_at
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_user_progress ON public.assessment_results;
CREATE TRIGGER trigger_update_user_progress
  AFTER INSERT ON public.assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progress();
-- Run this entire script in Supabase SQL Editor.
-- It is safe to rerun.

CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  content TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  score INTEGER,
  feedback TEXT,
  suggestions JSONB,
  model_used VARCHAR(100),
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_upload_date ON public.resumes(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume_id ON public.resume_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON public.resume_analyses(user_id);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
CREATE POLICY "Users can view their own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
CREATE POLICY "Users can insert their own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
CREATE POLICY "Users can update their own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
CREATE POLICY "Users can delete their own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can view their own resume analyses" ON public.resume_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can insert their own resume analyses" ON public.resume_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can update their own resume analyses" ON public.resume_analyses
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can delete their own resume analyses" ON public.resume_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload resume files" ON storage.objects;
CREATE POLICY "Users can upload resume files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view resume files" ON storage.objects;
CREATE POLICY "Users can view resume files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update resume files" ON storage.objects;
CREATE POLICY "Users can update resume files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete resume files" ON storage.objects;
CREATE POLICY "Users can delete resume files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
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
-- Create saved_jobs table for job search functionality
-- Run this SQL command in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_data JSONB NOT NULL,
  search_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created_at ON saved_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can insert their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can update their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON saved_jobs;

-- Create RLS policies for saved_jobs table
CREATE POLICY "Users can view their own saved jobs" ON saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved jobs" ON saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved jobs" ON saved_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs" ON saved_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_saved_jobs_updated_at ON saved_jobs;

-- Create updated_at trigger for saved_jobs table
CREATE TRIGGER update_saved_jobs_updated_at
  BEFORE UPDATE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();