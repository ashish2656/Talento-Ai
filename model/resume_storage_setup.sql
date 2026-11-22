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
