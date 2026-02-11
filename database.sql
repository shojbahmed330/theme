
-- ১. ইউজার টেবিল ও কলাম সেটআপ
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tokens INTEGER DEFAULT 10,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  github_token TEXT,
  github_owner TEXT,
  github_repo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ২. প্রজেক্ট টেবিল (Multiple Project Support)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own projects (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" 
ON public.projects 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ৩. প্যাকেজ টেবিল
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price INTEGER NOT NULL,
  color TEXT DEFAULT 'cyan',
  icon TEXT DEFAULT 'Package',
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৪. ট্রানজেকশন টেবিল
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  trx_id TEXT,
  screenshot_url TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৫. অ্যাক্টিভিটি লগ টেবিল
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT,
  admin_email TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৬. অটোমেটিক লগিং ট্রিগার
CREATE OR REPLACE FUNCTION public.log_user_updates()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    admin_email_from_jwt TEXT;
BEGIN
    BEGIN
        admin_email_from_jwt := auth.jwt() ->> 'email';
    EXCEPTION WHEN OTHERS THEN
        admin_email_from_jwt := 'SYSTEM';
    END;

    IF admin_email_from_jwt IS NULL THEN
        admin_email_from_jwt := 'SYSTEM_TRIGGER';
    END IF;

    IF OLD.tokens <> NEW.tokens THEN
        INSERT INTO public.activity_logs (admin_email, action, details)
        VALUES (admin_email_from_jwt, 'TOKEN_UPDATE', 'User: ' || NEW.email || ' | ' || OLD.tokens || ' -> ' || NEW.tokens);
    END IF;

    IF OLD.is_banned <> NEW.is_banned THEN
        INSERT INTO public.activity_logs (admin_email, action, details)
        VALUES (admin_email_from_jwt, CASE WHEN NEW.is_banned THEN 'USER_SUSPEND' ELSE 'USER_UNSUSPEND' END, 'User: ' || NEW.email);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_update_log ON public.users;
CREATE TRIGGER on_user_update_log
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.log_user_updates();

-- ৭. প্যাকেজ ম্যানেজমেন্ট লগ ট্রিগার
CREATE OR REPLACE FUNCTION public.log_package_changes()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    admin_email_from_jwt TEXT;
BEGIN
    BEGIN
        admin_email_from_jwt := auth.jwt() ->> 'email';
    EXCEPTION WHEN OTHERS THEN
        admin_email_from_jwt := 'SYSTEM';
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (admin_email, action, details)
        VALUES (admin_email_from_jwt, 'PACKAGE_CREATE', 'Name: ' || NEW.name || ' | Price: ' || NEW.price);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_logs (admin_email, action, details)
        VALUES (admin_email_from_jwt, 'PACKAGE_MODIFY', 'Modified: ' || NEW.name);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_logs (admin_email, action, details)
        VALUES (admin_email_from_jwt, 'PACKAGE_DELETE', 'Deleted: ' || OLD.name);
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_package_change_log ON public.packages;
CREATE TRIGGER on_package_change_log
  AFTER INSERT OR UPDATE OR DELETE ON public.packages
  FOR EACH ROW EXECUTE PROCEDURE public.log_package_changes();

-- ৮. রিয়েল-টাইম পাবলিকেশন
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
END $$;
