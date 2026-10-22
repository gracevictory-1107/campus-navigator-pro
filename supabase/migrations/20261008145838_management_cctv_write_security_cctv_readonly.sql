-- Reconstructed migration record for the already-applied remote version 20261008145838.
-- Source: current supabase/schema.sql and read-only inspection of deployed camera_configs policies.
-- The remote version is already applied; do not run this manually against production.

ALTER TABLE public.camera_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS camera_configs_security_insert ON public.camera_configs;
DROP POLICY IF EXISTS camera_configs_security_update ON public.camera_configs;
DROP POLICY IF EXISTS camera_configs_security_delete ON public.camera_configs;
DROP POLICY IF EXISTS camera_configs_management_insert ON public.camera_configs;
DROP POLICY IF EXISTS camera_configs_management_update ON public.camera_configs;
DROP POLICY IF EXISTS camera_configs_management_delete ON public.camera_configs;

CREATE POLICY camera_configs_management_insert ON public.camera_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.current_campus_role() IN ('admin', 'management'));
CREATE POLICY camera_configs_management_update ON public.camera_configs
  FOR UPDATE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management'))
  WITH CHECK (public.current_campus_role() IN ('admin', 'management'));
CREATE POLICY camera_configs_management_delete ON public.camera_configs
  FOR DELETE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management'));

DROP POLICY IF EXISTS camera_configs_security_select ON public.camera_configs;
CREATE POLICY camera_configs_security_select ON public.camera_configs
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

REVOKE ALL ON public.camera_configs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camera_configs TO authenticated;
