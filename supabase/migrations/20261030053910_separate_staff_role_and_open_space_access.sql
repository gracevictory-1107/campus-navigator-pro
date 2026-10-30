-- Keep Faculty and Staff as separate campus account roles and allow the
-- Main Building Ground Floor Open Space for every visitor category.
BEGIN;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'faculty', 'staff', 'management', 'security', 'student', 'pending'));

INSERT INTO public.access_rules (id, location_id, person_type, allowed)
VALUES
  ('Parent:path:mb-gf:free-space-2', 'path:mb-gf:free-space-2', 'Parent', true),
  ('Product/Business Visitor:path:mb-gf:free-space-2', 'path:mb-gf:free-space-2', 'Product/Business Visitor', true),
  ('Inspirational/Motivational Visitor:path:mb-gf:free-space-2', 'path:mb-gf:free-space-2', 'Inspirational/Motivational Visitor', true),
  ('Faculty/Staff:path:mb-gf:free-space-2', 'path:mb-gf:free-space-2', 'Faculty/Staff', true),
  ('Recruiter:path:mb-gf:free-space-2', 'path:mb-gf:free-space-2', 'Recruiter', true),
  ('General Visitor:path:mb-gf:free-space-2', 'path:mb-gf:free-space-2', 'General Visitor', true)
ON CONFLICT (id) DO UPDATE
SET location_id = EXCLUDED.location_id,
    allowed = EXCLUDED.allowed,
    updated_at = now();

COMMIT;
