-- Align live table privileges with the application role model and repair visitor schema drift.
-- This migration intentionally does not alter campus profile roles or delete production records.

BEGIN;

-- Stop broad Supabase default ACLs from giving API roles all privileges on new public objects.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Normalize the one legacy NULL email before restoring the intended NOT NULL constraint.
UPDATE public.visitors SET email = '' WHERE email IS NULL;
ALTER TABLE public.visitors ALTER COLUMN email SET DEFAULT '';
ALTER TABLE public.visitors ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.visitors ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.visitors ALTER COLUMN is_active SET NOT NULL;

-- Keep the bootstrap schema and live biometric access model consistent: Admin/Security only.
DROP POLICY IF EXISTS biometric_profiles_management_read ON public.biometric_profiles;
DROP POLICY IF EXISTS biometric_verification_events_management_read ON public.biometric_verification_events;

-- Remove excess existing table/sequence grants, including TRUNCATE, then grant only required operations.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (role) ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.access_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.visitors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.security_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.biometric_profiles TO authenticated;
GRANT SELECT, INSERT ON public.biometric_verification_events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.camera_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camera_coverage_areas TO authenticated;

-- Role lookup is used inside RLS policies. Keep execution restricted to signed-in users,
-- pin the SECURITY DEFINER function's search path to empty, and schema-qualify referenced objects.
CREATE OR REPLACE FUNCTION public.current_campus_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_campus_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_campus_role() TO authenticated;

-- Trigger functions are not intended to be exposed as browser-callable RPCs.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_auth_user_profile() FROM PUBLIC, anon, authenticated;

COMMIT;
