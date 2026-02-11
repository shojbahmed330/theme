
-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tokens INTEGER DEFAULT 10,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false, -- New: Support for dynamic admin creation
  github_token TEXT,
  github_owner TEXT,
  github_repo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price INTEGER NOT NULL,
  color TEXT DEFAULT 'cyan',
  icon TEXT DEFAULT 'Package',
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  trx_id TEXT,
  screenshot_url TEXT,
  message TEXT, -- Added for admin notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  files JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb, -- Added to store app icons/config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT,
  admin_email TEXT,
  action TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- 3. REALTIME CONFIGURATION
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE tablename='transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. CLEANUP OLD POLICIES
-- ============================================================
DO $$ DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- ============================================================
-- 6. HELPER FUNCTION FOR DYNAMIC ADMIN CHECK
-- ============================================================
-- This function checks if the current logged-in user is an admin.
-- It also allows the master UID for system maintenance.
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.users 
    WHERE id = auth.uid()
  ) OR (auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. RLS POLICIES (UPDATED FOR DYNAMIC ADMINS)
-- ============================================================

-- USERS POLICIES
CREATE POLICY "users_own_profile" ON public.users FOR SELECT
USING (auth.uid() = id AND is_banned=false);

CREATE POLICY "users_update_own" ON public.users FOR UPDATE
USING (auth.uid() = id AND is_banned=false);

CREATE POLICY "admin_all_users" ON public.users FOR ALL
USING (is_admin_check());

-- PACKAGES POLICIES
CREATE POLICY "public_view_packages" ON public.packages FOR SELECT USING (true);

CREATE POLICY "admin_manage_packages" ON public.packages FOR ALL
USING (is_admin_check());

-- TRANSACTIONS POLICIES
CREATE POLICY "users_view_own_trx" ON public.transactions FOR SELECT
USING (auth.uid() = user_id AND (SELECT is_banned FROM users WHERE id=auth.uid()) = false);

CREATE POLICY "users_insert_own_trx" ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_manage_trx" ON public.transactions FOR ALL
USING (is_admin_check());

-- PROJECTS POLICIES
CREATE POLICY "Project Access Policy"
ON public.projects
FOR ALL
TO anon, authenticated
USING (
    (auth.uid() = user_id AND (SELECT is_banned FROM users WHERE id=auth.uid()) = false)
    OR is_admin_check()
)
WITH CHECK (
    (auth.uid() = user_id AND (SELECT is_banned FROM users WHERE id=auth.uid()) = false)
    OR is_admin_check()
);

-- ACTIVITY LOGS POLICIES
CREATE POLICY "admin_logs_view" ON public.activity_logs FOR SELECT
USING (is_admin_check());

CREATE POLICY "system_logs_insert" ON public.activity_logs FOR INSERT
WITH CHECK (true);

-- ============================================================
-- 8. TRIGGER FUNCTIONS (ORIGINAL LOGIC RESTORED)
-- ============================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, tokens, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    10,
    -- Auto-grant admin to the primary owner only
    CASE WHEN new.email = 'rajshahi.jibon@gmail.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$;

-- Function to log updates to users (Tokens, Ban/Unban)
CREATE OR REPLACE FUNCTION public.log_user_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.tokens <> NEW.tokens THEN
    INSERT INTO activity_logs(admin_email, action, details)
    VALUES (
      COALESCE(auth.jwt()->>'email','SYSTEM'),
      'TOKEN_UPDATE',
      NEW.email || ' ' || OLD.tokens || '->' || NEW.tokens
    );
  END IF;

  IF OLD.is_banned <> NEW.is_banned THEN
    INSERT INTO activity_logs(admin_email, action, details)
    VALUES (
      COALESCE(auth.jwt()->>'email','SYSTEM'),
      CASE WHEN NEW.is_banned THEN 'BAN' ELSE 'UNBAN' END,
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Function to log package modifications
CREATE OR REPLACE FUNCTION public.log_package_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO activity_logs(admin_email, action, details)
    VALUES (COALESCE(auth.jwt()->>'email','SYSTEM'), 'PACKAGE_CREATE', NEW.name);
  ELSIF TG_OP='UPDATE' THEN
    INSERT INTO activity_logs(admin_email, action, details)
    VALUES (COALESCE(auth.jwt()->>'email','SYSTEM'), 'PACKAGE_UPDATE', NEW.name);
  ELSIF TG_OP='DELETE' THEN
    INSERT INTO activity_logs(admin_email, action, details)
    VALUES (COALESCE(auth.jwt()->>'email','SYSTEM'), 'PACKAGE_DELETE', OLD.name);
  END IF;
  RETURN NULL;
END;
$$;

-- Function to auto-update project timestamps
CREATE OR REPLACE FUNCTION public.update_project_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 9. TRIGGERS (RE-CREATION)
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_update_log ON public.users;
CREATE TRIGGER on_user_update_log
AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE public.log_user_updates();

DROP TRIGGER IF EXISTS on_package_change_log ON public.packages;
CREATE TRIGGER on_package_change_log
AFTER INSERT OR UPDATE OR DELETE ON public.packages
FOR EACH ROW EXECUTE PROCEDURE public.log_package_changes();

DROP TRIGGER IF EXISTS update_projects_timestamp ON public.projects;
CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE PROCEDURE public.update_project_timestamp();

-- ============================================================
-- 10. SEED DATA & MAINTENANCE
-- ============================================================

-- Ensure the Primary Admin has access
UPDATE public.users 
SET is_admin = true 
WHERE email = 'rajshahi.jibon@gmail.com';

-- Insert Default Packages
INSERT INTO public.packages (name, tokens, price, color, icon, is_popular)
VALUES
('Developer Starter', 50, 500, 'cyan', 'Package', false),
('Pro Builder', 250, 1500, 'purple', 'Rocket', true),
('Agency Master', 1200, 5000, 'amber', 'Cpu', false)
ON CONFLICT DO NOTHING;
