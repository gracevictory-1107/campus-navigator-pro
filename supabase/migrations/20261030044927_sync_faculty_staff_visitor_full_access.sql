-- Reconstructed historical migration body: the Faculty/Staff employee
-- access category is permitted across all of the mapped campus locations.
-- This version is already recorded as applied in the connected project.
UPDATE public.access_rules
SET allowed = true,
    updated_at = now()
WHERE person_type = 'Faculty/Staff';
