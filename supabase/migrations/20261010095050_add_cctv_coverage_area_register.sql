-- Reconstructed migration record for the already-applied remote version 20261010095050.
-- Unknown CCTV locations remain unconfirmed rather than being inferred.
-- The remote version is already applied; do not run this manually against production.

CREATE TABLE IF NOT EXISTS public.camera_coverage_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building text NOT NULL DEFAULT 'Unmapped',
  floor_id text,
  area_label text NOT NULL,
  coverage_type text NOT NULL CHECK (coverage_type IN ('camera_present', 'camera_free', 'unknown')),
  camera_id text REFERENCES public.camera_configs(camera_id) ON DELETE SET NULL,
  source_image text,
  notes text NOT NULL DEFAULT '',
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS camera_coverage_areas_floor_idx
  ON public.camera_coverage_areas (building, floor_id);
CREATE INDEX IF NOT EXISTS camera_coverage_areas_camera_idx
  ON public.camera_coverage_areas (camera_id);

ALTER TABLE public.camera_coverage_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS camera_coverage_areas_security_read ON public.camera_coverage_areas;
CREATE POLICY camera_coverage_areas_security_read ON public.camera_coverage_areas
  FOR SELECT TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management', 'security'));

DROP POLICY IF EXISTS camera_coverage_areas_management_write ON public.camera_coverage_areas;
CREATE POLICY camera_coverage_areas_management_write ON public.camera_coverage_areas
  FOR ALL TO authenticated
  USING (public.current_campus_role() IN ('admin', 'management'))
  WITH CHECK (public.current_campus_role() IN ('admin', 'management'));

DROP TRIGGER IF EXISTS camera_coverage_areas_set_updated_at ON public.camera_coverage_areas;
CREATE TRIGGER camera_coverage_areas_set_updated_at
  BEFORE UPDATE ON public.camera_coverage_areas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
