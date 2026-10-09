-- Keep the auth-trigger helper callable only by PostgreSQL's trigger mechanism.
-- It is SECURITY DEFINER and is not intended to be an exposed RPC.
REVOKE ALL ON FUNCTION public.handle_new_auth_user_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_auth_user_profile() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_auth_user_profile() FROM authenticated;

-- Support joins and deletes on biometric audit foreign keys.
CREATE INDEX IF NOT EXISTS biometric_verification_events_profile_id_idx
  ON public.biometric_verification_events (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS biometric_verification_events_security_event_id_idx
  ON public.biometric_verification_events (security_event_id)
  WHERE security_event_id IS NOT NULL;
