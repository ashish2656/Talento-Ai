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
