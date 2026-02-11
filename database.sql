
-- ... (existing tables)

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
CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT TO anon, authenticated USING (true);
