
-- ১. আগের সব পলিসি ক্লিন করা
DO $$ DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- ২. সিকিউরিটি চেক এনেবল রাখা
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ৩. একটি সার্বজনীন অ্যাডমিন চেক পলিসি তৈরি করা
-- ইমেইল: 'rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com'
-- মাস্টার আইডি: '329a8566-838f-4e61-a91c-2e6c6d492420'

-- ৪. ইউজার টেবিল পলিসি
CREATE POLICY "Admin Full Access Users"
ON public.users FOR ALL
TO authenticated, anon
USING (
    (auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com')) OR
    (id = auth.uid()) OR
    (auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420')
);

-- ৫. পেমেন্ট (Transactions) টেবিল পলিসি
CREATE POLICY "Admin Full Access Transactions"
ON public.transactions FOR ALL
TO authenticated, anon
USING (
    (auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com')) OR
    (user_id = auth.uid()) OR
    (auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420')
);

-- ৬. প্রোজেক্ট টেবিল পলিসি
CREATE POLICY "Admin Full Access Projects"
ON public.projects FOR ALL
TO authenticated, anon
USING (
    (auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com')) OR
    (user_id = auth.uid()) OR
    (auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420')
);

-- ৭. প্যাকেজ টেবিল পলিসি
CREATE POLICY "Admin Full Access Packages"
ON public.packages FOR ALL
TO authenticated, anon
USING (true); -- সবাই দেখতে পারবে, অ্যাডমিনরা ম্যানেজ করতে পারবে

-- ৮. সিস্টেম লগ পলিসি
CREATE POLICY "Admin Full Access Logs"
ON public.activity_logs FOR ALL
TO authenticated, anon
USING (
    (auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com')) OR
    (auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420')
);
