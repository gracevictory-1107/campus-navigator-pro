-- Preserve the current role permissions while eliminating overlapping
-- permissive SELECT policies and row-by-row auth function evaluations.
BEGIN;

-- Profiles: wrap stable auth lookups in scalar subqueries so Postgres can
-- evaluate them once per statement rather than once per scanned row.
DROP POLICY IF EXISTS profiles_select_self_or_admin ON public.profiles;
CREATE POLICY profiles_select_self_or_admin
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT public.current_campus_role()) = 'admin'
  );

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.current_campus_role()) = 'admin'
    AND auth_user_id IS DISTINCT FROM (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT public.current_campus_role()) = 'admin'
    AND auth_user_id IS DISTINCT FROM (SELECT auth.uid())
  );

-- One equivalent privileged-reader policy per operational table.
DROP POLICY IF EXISTS access_rules_management_read ON public.access_rules;
DROP POLICY IF EXISTS access_rules_security_read ON public.access_rules;
CREATE POLICY access_rules_privileged_read
  ON public.access_rules
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

DROP POLICY IF EXISTS alerts_management_read ON public.alerts;
DROP POLICY IF EXISTS alerts_security_select ON public.alerts;
CREATE POLICY alerts_privileged_read
  ON public.alerts
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

DROP POLICY IF EXISTS events_security_select ON public.security_events;
DROP POLICY IF EXISTS security_events_management_read ON public.security_events;
CREATE POLICY security_events_privileged_read
  ON public.security_events
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

DROP POLICY IF EXISTS visitors_management_read ON public.visitors;
DROP POLICY IF EXISTS visitors_security_select ON public.visitors;
CREATE POLICY visitors_privileged_read
  ON public.visitors
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

-- Camera coverage: retain Admin/Management write access and let Security read.
-- The previous FOR ALL policy overlapped with the read policy on SELECT.
DROP POLICY IF EXISTS camera_coverage_areas_management_write ON public.camera_coverage_areas;
DROP POLICY IF EXISTS camera_coverage_areas_security_read ON public.camera_coverage_areas;

CREATE POLICY camera_coverage_areas_privileged_read
  ON public.camera_coverage_areas
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

CREATE POLICY camera_coverage_areas_management_insert
  ON public.camera_coverage_areas
  FOR INSERT TO authenticated
  WITH CHECK (public.current_campus_role() IN ('admin', 'management'));

CREATE POLICY camera_coverage_areas_management_update
  ON public.camera_coverage_areas
  FOR UPDATE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management'))
  WITH CHECK (public.current_campus_role() IN ('admin', 'management'));

CREATE POLICY camera_coverage_areas_management_delete
  ON public.camera_coverage_areas
  FOR DELETE TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management'));

COMMIT;
