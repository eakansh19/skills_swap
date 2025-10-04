-- Create profiles table for user metadata
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('offered', 'needed')),
  proficiency_level TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Skills policies
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own skills"
  ON public.skills FOR ALL
  USING (auth.uid() = user_id);

-- Create agreements table
CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_offered TEXT NOT NULL,
  skill_needed TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Agreements policies
CREATE POLICY "Users can view their own agreements"
  ON public.agreements FOR SELECT
  USING (auth.uid() = provider_id OR auth.uid() = seeker_id);

CREATE POLICY "Users can create agreements"
  ON public.agreements FOR INSERT
  WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Participants can update agreements"
  ON public.agreements FOR UPDATE
  USING (auth.uid() = provider_id OR auth.uid() = seeker_id);

-- Create reputation table
CREATE TABLE public.reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0 NOT NULL,
  completed_exchanges INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reputation ENABLE ROW LEVEL SECURITY;

-- Reputation policies
CREATE POLICY "Reputation is viewable by everyone"
  ON public.reputation FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reputation"
  ON public.reputation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  
  INSERT INTO public.reputation (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update reputation on agreement completion
CREATE OR REPLACE FUNCTION public.update_reputation_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.reputation
    SET 
      total_points = total_points + 10,
      completed_exchanges = completed_exchanges + 1,
      updated_at = NOW()
    WHERE user_id = NEW.provider_id OR user_id = NEW.seeker_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_agreement_completed
  AFTER UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_reputation_on_completion();