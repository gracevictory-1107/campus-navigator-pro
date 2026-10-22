-- Reconstructed migration record for the already-applied remote version 20261009040451.
-- Source: schema history and the superseding pending-account migration.
-- The remote version is already applied; do not run this manually against production.

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_student_profile ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_student_profile()
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
    'student'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created_student_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_student_profile();
