-- Reject first-time Google OAuth account creation.
-- Existing email/password accounts can use Google only after Supabase has verified
-- the email and linked the provider identity. Configure this function as the
-- Supabase Auth "Before User Created" hook in the dashboard.
CREATE OR REPLACE FUNCTION public.hook_reject_google_signups(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  provider text;
BEGIN
  provider := event #>> '{user,app_metadata,provider}';

  IF provider = 'google' THEN
    RETURN jsonb_build_object(
      'error',
      jsonb_build_object(
        'message', 'Google sign-in is only available after you register with your email and password and verify your email address.',
        'http_code', 403
      )
    );
  END IF;

  RETURN '{}'::jsonb;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.hook_reject_google_signups(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hook_reject_google_signups(jsonb) TO supabase_auth_admin;
