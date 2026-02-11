
-- ১. আগে যদি কোনো পলিসি থেকে থাকে সেগুলো ক্লিন করা (Cleanup)
DO $$ DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- ২. সিকিউরিটি এনেবল করা
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ৩. অ্যাডমিন এক্সেস লজিক (একটি ফাংশন বানিয়ে নিচ্ছি যাতে বারবার লিখতে না হয়)
-- ইমেইলগুলো: 'rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com'
-- মাস্টার আইডি: '329a8566-838f-4e61-a91c-2e6c6d492420'

-- ৪. ইউজার টেবিল পলিসি
CREATE POLICY "Admin & User Profile Access"
ON public.users FOR ALL
USING (
    auth.uid() = id OR 
    auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com') OR
    auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420'
);

-- ৫. প্যাকেজ টেবিল পলিসি
CREATE POLICY "Package View and Admin Manage"
ON public.packages FOR ALL
USING (
    (auth.role() = 'authenticated' OR auth.role() = 'anon') AND 
    (
        auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com') OR
        auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420' OR
        true -- Default view access for everyone
    )
);

-- ৬. ট্রানজেকশন (পেমেন্ট) টেবিল পলিসি - এটা অ্যাডমিনদের জন্য সবচেয়ে গুরুত্বপূর্ণ
CREATE POLICY "Admin Payment Access"
ON public.transactions FOR ALL
USING (
    auth.uid() = user_id OR 
    auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com') OR
    auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420'
);

-- ৭. প্রোজেক্ট টেবিল পলিসি
CREATE POLICY "Project Access Control"
ON public.projects FOR ALL
USING (
    auth.uid() = user_id OR 
    auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com') OR
    auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420'
);

-- ৮. সিস্টেম লগ পলিসি (এখানেই জীবন এর সমস্যা ছিল)
CREATE POLICY "System Logs Access"
ON public.activity_logs FOR ALL
USING (
    auth.jwt()->>'email' IN ('rajshahi.shojib@gmail.com', 'rajshahi.jibon@gmail.com', 'rajshahi.sumi@gmail.com') OR
    auth.uid() = '329a8566-838f-4e61-a91c-2e6c6d492420'
);
