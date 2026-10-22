-- Reconstructed migration record for the already-applied remote version 20261008153139.
-- Source: current supabase/schema.sql and read-only inspection of deployed biometric policies.
-- The remote version is already applied; do not run this manually against production.

ALTER TABLE public.biometric_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_verification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS biometric_profiles_security_select ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_select ON public.biometric_profiles
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'security'));
DROP POLICY IF EXISTS biometric_profiles_security_insert ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_insert ON public.biometric_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.current_campus_role() IN ('admin', 'security'));
DROP POLICY IF EXISTS biometric_profiles_security_update ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_update ON public.biometric_profiles
  FOR UPDATE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'security'))
  WITH CHECK (public.current_campus_role() IN ('admin', 'security'));
DROP POLICY IF EXISTS biometric_profiles_security_delete ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_delete ON public.biometric_profiles
  FOR DELETE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'security'));

DROP POLICY IF EXISTS biometric_verification_events_security_select ON public.biometric_verification_events;
CREATE POLICY biometric_verification_events_security_select ON public.biometric_verification_events
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'security'));
DROP POLICY IF EXISTS biometric_verification_events_security_insert ON public.biometric_verification_events;
CREATE POLICY biometric_verification_events_security_insert ON public.biometric_verification_events
  FOR INSERT TO authenticated
  WITH CHECK (public.current_campus_role() IN ('admin', 'security'));

REVOKE ALL ON public.biometric_profiles, public.biometric_verification_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.biometric_profiles TO authenticated;
GRANT SELECT, INSERT ON public.biometric_verification_events TO authenticated;
