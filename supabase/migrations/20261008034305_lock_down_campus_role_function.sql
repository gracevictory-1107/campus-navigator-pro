-- Reconstructed migration record for the already-applied remote version 20261008034305.
-- Source: current supabase/schema.sql and read-only inspection of the deployed function catalog.
-- The remote version is already applied; do not run this manually against production.

CREATE OR REPLACE FUNCTION public.current_campus_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_campus_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_campus_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_campus_role() TO authenticated;
