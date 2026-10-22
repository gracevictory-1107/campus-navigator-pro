-- Reconstructed migration record for the already-applied remote version 20261008034107.
-- Source: current supabase/schema.sql and read-only inspection of the deployed policy catalog.
-- The remote version is already applied; do not run this manually against production.

-- Management is read-only for operational/security records.
DROP POLICY IF EXISTS access_rules_management_read ON public.access_rules;
CREATE POLICY access_rules_management_read ON public.access_rules
  FOR SELECT TO authenticated USING (public.current_campus_role() = 'management');
DROP POLICY IF EXISTS visitors_management_read ON public.visitors;
CREATE POLICY visitors_management_read ON public.visitors
  FOR SELECT TO authenticated USING (public.current_campus_role() = 'management');
DROP POLICY IF EXISTS events_management_read ON public.security_events;
CREATE POLICY events_management_read ON public.security_events
  FOR SELECT TO authenticated USING (public.current_campus_role() = 'management');
DROP POLICY IF EXISTS alerts_management_read ON public.alerts;
CREATE POLICY alerts_management_read ON public.alerts
  FOR SELECT TO authenticated USING (public.current_campus_role() = 'management');
DROP POLICY IF EXISTS biometric_profiles_management_read ON public.biometric_profiles;
CREATE POLICY biometric_profiles_management_read ON public.biometric_profiles
  FOR SELECT TO authenticated USING (public.current_campus_role() = 'management');
DROP POLICY IF EXISTS biometric_verification_events_management_read ON public.biometric_verification_events;
CREATE POLICY biometric_verification_events_management_read ON public.biometric_verification_events
  FOR SELECT TO authenticated USING (public.current_campus_role() = 'management');

-- CCTV network configuration is separated from the security-event tables.
CREATE TABLE IF NOT EXISTS public.camera_configs (
  camera_id text PRIMARY KEY,
  ip_address text NOT NULL DEFAULT '',
  stream_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.camera_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS camera_configs_security_select ON public.camera_configs;
CREATE POLICY camera_configs_security_select ON public.camera_configs
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

-- Initial write policy retained for the next migration to narrow/realign explicitly.
DROP POLICY IF EXISTS camera_configs_security_insert ON public.camera_configs;
CREATE POLICY camera_configs_security_insert ON public.camera_configs
  FOR INSERT TO authenticated WITH CHECK (public.current_campus_role() IN ('admin', 'security'));
DROP POLICY IF EXISTS camera_configs_security_update ON public.camera_configs;
CREATE POLICY camera_configs_security_update ON public.camera_configs
  FOR UPDATE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'security'))
  WITH CHECK (public.current_campus_role() IN ('admin', 'security'));
DROP POLICY IF EXISTS camera_configs_security_delete ON public.camera_configs;
CREATE POLICY camera_configs_security_delete ON public.camera_configs
  FOR DELETE TO authenticated USING (public.current_campus_role() IN ('admin', 'security'));

REVOKE ALL ON public.camera_configs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camera_configs TO authenticated;
DROP TRIGGER IF EXISTS camera_configs_set_updated_at ON public.camera_configs;
CREATE TRIGGER camera_configs_set_updated_at BEFORE UPDATE ON public.camera_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
