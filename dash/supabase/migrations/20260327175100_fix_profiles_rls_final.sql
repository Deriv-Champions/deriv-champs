
-- 1. Create a SECURITY DEFINER function to check if the user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all conflicting policies on public.profiles to start fresh
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin protection" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_policy" ON public.profiles;

-- 3. Create simple, non-recursive policies
-- SELECT: Anyone authenticated can read (Safe, no subquery)
CREATE POLICY "profiles_select_all" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- ALL: Only super admins can manage (Safe, calls SEC DEFINER function)
CREATE POLICY "profiles_admin_all" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- SERVICE ROLE: Full access (Always safe)
CREATE POLICY "profiles_service_all" 
ON public.profiles FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);
