-- Reconciled to the remote Supabase migration version 20261009042847.
-- New signups must be approved by an Admin before receiving campus permissions.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['admin', 'faculty', 'management', 'security', 'student', 'pending']::text[]));

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'pending';

DROP TRIGGER IF EXISTS on_auth_user_created_student_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.email IS NULL OR length(trim(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (auth_user_id, full_name, email, role)
  VALUES (
    NEW.id,
    coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(NEW.email, '@', 1)),
    lower(trim(NEW.email)),
    'pending'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_profile();

DROP FUNCTION IF EXISTS public.handle_new_auth_user_student_profile();
