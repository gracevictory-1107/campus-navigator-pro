-- Keep browser-created alert IDs in sync with the database's one-alert-per-event trigger.
-- The event UUID is the stable idempotency key across client retries and realtime refreshes.
CREATE OR REPLACE FUNCTION public.create_restricted_security_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  event_snapshot jsonb;
BEGIN
  IF NEW.access <> 'restricted' THEN
    RETURN NEW;
  END IF;

  event_snapshot :=
    pg_catalog.jsonb_build_object(
      'id', NEW.id,
      'personId', NEW.person_id,
      'personName', NEW.person_name,
      'personType', NEW.person_type,
      'cameraId', NEW.camera_id,
      'locationId', NEW.location_id,
      'locationName', NEW.location_name,
      'building', NEW.building,
      'floorId', NEW.floor_id,
      'roomId', NEW.room_id,
      'access', NEW.access,
      'at', NEW.occurred_at
    ) ||
    CASE
      WHEN NEW.source = 'route' THEN pg_catalog.jsonb_build_object('source', 'route')
      ELSE '{}'::jsonb
    END;

  INSERT INTO public.alerts (
    id,
    event_id,
    event_snapshot,
    severity,
    status,
    history
  )
  VALUES (
    'ALT-' || pg_catalog.upper(pg_catalog.left(pg_catalog.replace(NEW.id, '-', ''), 8)),
    NEW.id,
    event_snapshot,
    'High',
    'Active',
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'status', 'Active',
        'at', NEW.occurred_at,
        'by', 'security'
      )
    )
  )
  ON CONFLICT (event_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_restricted_security_alert() FROM PUBLIC, anon, authenticated;
