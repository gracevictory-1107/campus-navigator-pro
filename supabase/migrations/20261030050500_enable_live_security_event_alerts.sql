-- Stream new person-location events and alerts to active Security dashboards.
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Every restricted security event becomes one durable alert. This covers camera
-- integrations as well as route-policy events, without trusting a browser tab
-- to create the alert after it has already detected the event.
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
    'ALT-' || pg_catalog.upper(pg_catalog.left(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 8)),
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

DROP TRIGGER IF EXISTS security_events_create_restricted_alert ON public.security_events;
CREATE TRIGGER security_events_create_restricted_alert
AFTER INSERT ON public.security_events
FOR EACH ROW
EXECUTE FUNCTION public.create_restricted_security_alert();

REVOKE ALL ON FUNCTION public.create_restricted_security_alert() FROM PUBLIC, anon, authenticated;
