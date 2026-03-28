
-- 1. Identify Super Admin in profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  IF new.email = 'otienoalvine925@gmail.com' THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'super_admin');
  ELSE
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'admin');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Prevent deletion of the Super Admin profile
CREATE OR REPLACE FUNCTION public.check_super_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF old.email = 'otienoalvine925@gmail.com' THEN
    RAISE EXCEPTION 'The primary Super Admin profile cannot be deleted.';
  END IF;
  RETURN old;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_super_admin_deletion
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_super_admin_deletion();

-- 3. Prevent role downgrade of the Super Admin
CREATE OR REPLACE FUNCTION public.check_super_admin_update()
RETURNS TRIGGER AS $$
BEGIN
  IF old.email = 'otienoalvine925@gmail.com' AND new.role != 'super_admin' THEN
    RAISE EXCEPTION 'The primary Super Admin role cannot be changed.';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_super_admin_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_super_admin_update();

-- 4. Explicit RLS policy for Super Admin protection (redundant but safe)
CREATE POLICY "Super admin protection" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (email != 'otienoalvine925@gmail.com');

-- 5. Ensure existing email is super_admin if already present
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'otienoalvine925@gmail.com';
