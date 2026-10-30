-- Reconstructed migration body from the current schema and the deployed
-- access matrix. This historical version is already recorded as applied.
-- It is included so repository and remote migration history stay aligned.
BEGIN;

WITH locations(location_id) AS (
  VALUES
    ('main-gate'),
    ('canteen'),
    ('meeting-room'),
    ('library'),
    ('cse-lab'),
    ('staff-room'),
    ('mini-seminar-hall'),
    ('seminar-hall'),
    ('innovation-center'),
    ('dining-room'),
    ('ground-floor-corridor'),
    ('principal-office'),
    ('placement-cell'),
    ('administrative-office'),
    ('vice-principal-office'),
    ('reception'),
    ('office-desk'),
    ('cash-counter'),
    ('main-f2-hod-office'),
    ('main-f3-hod-office'),
    ('main-f4-hod-office'),
    ('main-f5-hod-office'),
    ('fisheries-dean-office'),
    ('path:mb-gf:lift'),
    ('path:mb-gf:stair-l'),
    ('path:mb-gf:stair-r'),
    ('path:mb-f1:lift'),
    ('path:mb-f1:stair-l'),
    ('path:mb-f1:corridor'),
    ('path:mb-f1:stair-r'),
    ('path:mb-f2:lift'),
    ('path:mb-f2:stair-l'),
    ('path:mb-f2:corridor'),
    ('path:mb-f2:stair-r'),
    ('path:mb-f3:lift'),
    ('path:mb-f3:stair-l'),
    ('path:mb-f3:corridor'),
    ('path:mb-f3:stair-r'),
    ('path:mb-f4:lift'),
    ('path:mb-f4:stair-l'),
    ('path:mb-f4:corridor'),
    ('path:mb-f4:stair-r'),
    ('path:mb-f5:lift'),
    ('path:mb-f5:stair-l'),
    ('path:mb-f5:corridor'),
    ('path:mb-f5:stair-r'),
    ('path:fb-gf:corridor'),
    ('path:fb-gf:stairs'),
    ('path:fb-gf:lift'),
    ('path:fb-f1:corridor'),
    ('path:fb-f1:stairs'),
    ('path:fb-f1:lift'),
    ('path:fb-f2:corridor'),
    ('path:fb-f2:stairs'),
    ('path:fb-f2:lift'),
    ('path:bb-f3:corridor'),
    ('path:bb-f3:stairs'),
    ('path:bb-f3:lift'),
    ('path:bb-f4:corridor'),
    ('path:bb-f4:stairs'),
    ('path:bb-f4:lift'),
    ('path:bb-f5:corridor'),
    ('path:bb-f5:stairs'),
    ('path:bb-f5:b18'),
    ('path:bb-f5:lift'),
    ('path:sheds:path1'),
    ('path:sheds:shed4-empty')
),
categories(person_type, allowed_locations) AS (
  VALUES
    ('Parent', ARRAY['main-gate', 'ground-floor-corridor', 'canteen', 'principal-office', 'placement-cell', 'administrative-office', 'vice-principal-office', 'reception', 'office-desk', 'cash-counter', 'main-f2-hod-office', 'main-f3-hod-office', 'main-f4-hod-office', 'main-f5-hod-office', 'fisheries-dean-office', 'path:mb-gf:stair-l', 'path:mb-gf:stair-r', 'path:mb-f1:stair-l', 'path:mb-f1:stair-r', 'path:mb-f2:stair-l', 'path:mb-f2:stair-r', 'path:mb-f3:stair-l', 'path:mb-f3:stair-r', 'path:mb-f4:stair-l', 'path:mb-f4:stair-r', 'path:mb-f5:stair-l', 'path:mb-f5:stair-r', 'path:fb-gf:stairs', 'path:fb-f1:stairs', 'path:fb-f2:stairs', 'path:bb-f3:stairs', 'path:bb-f4:stairs', 'path:bb-f5:stairs']::text[]),
    ('Recruiter', ARRAY['main-gate', 'canteen', 'library', 'principal-office', 'placement-cell', 'administrative-office', 'vice-principal-office', 'reception', 'office-desk', 'cash-counter', 'main-f2-hod-office', 'main-f3-hod-office', 'main-f4-hod-office', 'main-f5-hod-office', 'fisheries-dean-office', 'mini-seminar-hall', 'seminar-hall', 'innovation-center', 'dining-room', 'path:mb-gf:stair-l', 'path:mb-gf:stair-r', 'path:mb-f1:stair-l', 'path:mb-f1:stair-r', 'path:mb-f2:stair-l', 'path:mb-f2:stair-r', 'path:mb-f3:stair-l', 'path:mb-f3:stair-r', 'path:mb-f4:stair-l', 'path:mb-f4:stair-r', 'path:mb-f5:stair-l', 'path:mb-f5:stair-r', 'path:fb-gf:stairs', 'path:fb-f1:stairs', 'path:fb-f2:stairs', 'path:bb-f3:stairs', 'path:bb-f4:stairs', 'path:bb-f5:stairs']::text[]),
    ('Product/Business Visitor', ARRAY['main-gate', 'ground-floor-corridor', 'canteen', 'principal-office', 'placement-cell', 'administrative-office', 'vice-principal-office', 'reception', 'office-desk', 'cash-counter', 'main-f2-hod-office', 'main-f3-hod-office', 'main-f4-hod-office', 'main-f5-hod-office', 'fisheries-dean-office', 'mini-seminar-hall', 'seminar-hall', 'path:mb-gf:stair-l', 'path:mb-gf:stair-r', 'path:mb-f1:stair-l', 'path:mb-f1:stair-r', 'path:mb-f2:stair-l', 'path:mb-f2:stair-r', 'path:mb-f3:stair-l', 'path:mb-f3:stair-r', 'path:mb-f4:stair-l', 'path:mb-f4:stair-r', 'path:mb-f5:stair-l', 'path:mb-f5:stair-r', 'path:fb-gf:stairs', 'path:fb-f1:stairs', 'path:fb-f2:stairs', 'path:bb-f3:stairs', 'path:bb-f4:stairs', 'path:bb-f5:stairs']::text[]),
    ('Inspirational/Motivational Visitor', ARRAY['main-gate', 'ground-floor-corridor', 'canteen', 'principal-office', 'placement-cell', 'administrative-office', 'vice-principal-office', 'reception', 'office-desk', 'cash-counter', 'main-f2-hod-office', 'main-f3-hod-office', 'main-f4-hod-office', 'main-f5-hod-office', 'fisheries-dean-office', 'mini-seminar-hall', 'seminar-hall', 'path:mb-gf:stair-l', 'path:mb-gf:stair-r', 'path:mb-f1:stair-l', 'path:mb-f1:stair-r', 'path:mb-f2:stair-l', 'path:mb-f2:stair-r', 'path:mb-f3:stair-l', 'path:mb-f3:stair-r', 'path:mb-f4:stair-l', 'path:mb-f4:stair-r', 'path:mb-f5:stair-l', 'path:mb-f5:stair-r', 'path:fb-gf:stairs', 'path:fb-f1:stairs', 'path:fb-f2:stairs', 'path:bb-f3:stairs', 'path:bb-f4:stairs', 'path:bb-f5:stairs']::text[]),
    ('Faculty/Staff', ARRAY['main-gate', 'canteen', 'meeting-room', 'library', 'cse-lab', 'staff-room', 'mini-seminar-hall', 'seminar-hall', 'innovation-center', 'dining-room', 'ground-floor-corridor', 'principal-office', 'placement-cell', 'administrative-office', 'vice-principal-office', 'reception', 'office-desk', 'cash-counter', 'main-f2-hod-office', 'main-f3-hod-office', 'main-f4-hod-office', 'main-f5-hod-office', 'fisheries-dean-office', 'path:mb-gf:lift', 'path:mb-gf:stair-l', 'path:mb-gf:stair-r', 'path:mb-f1:lift', 'path:mb-f1:stair-l', 'path:mb-f1:corridor', 'path:mb-f1:stair-r', 'path:mb-f2:lift', 'path:mb-f2:stair-l', 'path:mb-f2:corridor', 'path:mb-f2:stair-r', 'path:mb-f3:lift', 'path:mb-f3:stair-l', 'path:mb-f3:corridor', 'path:mb-f3:stair-r', 'path:mb-f4:lift', 'path:mb-f4:stair-l', 'path:mb-f4:corridor', 'path:mb-f4:stair-r', 'path:mb-f5:lift', 'path:mb-f5:stair-l', 'path:mb-f5:corridor', 'path:mb-f5:stair-r', 'path:fb-gf:corridor', 'path:fb-gf:stairs', 'path:fb-gf:lift', 'path:fb-f1:corridor', 'path:fb-f1:stairs', 'path:fb-f1:lift', 'path:fb-f2:corridor', 'path:fb-f2:stairs', 'path:fb-f2:lift', 'path:bb-f3:corridor', 'path:bb-f3:stairs', 'path:bb-f3:lift', 'path:bb-f4:corridor', 'path:bb-f4:stairs', 'path:bb-f4:lift', 'path:bb-f5:corridor', 'path:bb-f5:stairs', 'path:bb-f5:b18', 'path:bb-f5:lift', 'path:sheds:path1', 'path:sheds:shed4-empty']::text[]),
    ('General Visitor', ARRAY['main-gate', 'ground-floor-corridor', 'canteen', 'principal-office', 'placement-cell', 'administrative-office', 'vice-principal-office', 'reception', 'office-desk', 'cash-counter', 'main-f2-hod-office', 'main-f3-hod-office', 'main-f4-hod-office', 'main-f5-hod-office', 'fisheries-dean-office', 'mini-seminar-hall', 'seminar-hall', 'path:mb-gf:stair-l', 'path:mb-gf:stair-r', 'path:mb-f1:stair-l', 'path:mb-f1:stair-r', 'path:mb-f2:stair-l', 'path:mb-f2:stair-r', 'path:mb-f3:stair-l', 'path:mb-f3:stair-r', 'path:mb-f4:stair-l', 'path:mb-f4:stair-r', 'path:mb-f5:stair-l', 'path:mb-f5:stair-r', 'path:fb-gf:stairs', 'path:fb-f1:stairs', 'path:fb-f2:stairs', 'path:bb-f3:stairs', 'path:bb-f4:stairs', 'path:bb-f5:stairs']::text[])
)
INSERT INTO public.access_rules (id, location_id, person_type, allowed)
SELECT c.person_type || ':' || l.location_id,
       l.location_id,
       c.person_type,
       l.location_id = ANY (c.allowed_locations)
FROM categories c
CROSS JOIN locations l
ON CONFLICT (id)
DO UPDATE SET
  location_id = EXCLUDED.location_id,
  allowed = EXCLUDED.allowed,
  updated_at = now();

COMMIT;
