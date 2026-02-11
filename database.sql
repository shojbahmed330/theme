
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

-- ২. প্রজেক্ট টেবিল
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- ৫. আরএলএস পলিসি (SECURITY POLICIES)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- প্যাকেজ পলিসি: এডমিনরা প্যাকেজ ডিলিট করতে পারবে
CREATE POLICY "Admins can manage packages" 
ON public.packages FOR ALL 
TO authenticated 
USING (
  auth.jwt() ->> 'email' IN ('rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com')
);

CREATE POLICY "Anyone can view packages" 
ON public.packages FOR SELECT 
TO anon, authenticated 
USING (true);

-- ট্রানজেকশন পলিসি: এডমিনরা সব দেখতে পারবে এবং আপডেট করতে পারবে
CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'email' IN ('rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com')
);

CREATE POLICY "Admins can update transactions" 
ON public.transactions FOR UPDATE 
TO authenticated 
USING (
  auth.jwt() ->> 'email' IN ('rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com')
);

-- ইউজার পলিসি: এডমিনরা সব ইউজার দেখতে পারবে
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'email' IN ('rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com')
);

CREATE POLICY "Admins can update users" 
ON public.users FOR UPDATE 
TO authenticated 
USING (
  auth.jwt() ->> 'email' IN ('rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com')
);

-- সাধারণ ইউজারদের পলিসি
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own profile" ON public.users FOR ALL TO authenticated USING (auth.uid() = id);
