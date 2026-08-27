-- 1. Remove ticket_code constraint (Drop if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='event_registrations' AND column_name='ticket_code'
  ) THEN
    ALTER TABLE public.event_registrations ALTER COLUMN ticket_code DROP NOT NULL;
  END IF;
END $$;

-- 2. Create Event Questions
CREATE TABLE IF NOT EXISTS public.event_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Event Answers
CREATE TABLE IF NOT EXISTS public.event_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.event_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_answers ENABLE ROW LEVEL SECURITY;

-- 5. Create Q&A Policies
-- Questions
DO $$ BEGIN
  CREATE POLICY "Anyone can view questions" ON public.event_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can ask" ON public.event_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own questions" ON public.event_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Answers
DO $$ BEGIN
  CREATE POLICY "Anyone can view answers" ON public.event_answers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can answer" ON public.event_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own answers" ON public.event_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
