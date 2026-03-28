
-- 1. Backfill profiles for existing users in auth.users
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 
  CASE WHEN email = 'otienoalvine925@gmail.com' THEN 'super_admin' ELSE 'admin' END
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'otienoalvine925@gmail.com' THEN 'super_admin' ELSE public.profiles.role END;

-- 2. Ensure RLS is enabled and policies are correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow all authenticated users to read all profiles (so they can see the list)
CREATE POLICY "Allow authenticated users to read profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);
