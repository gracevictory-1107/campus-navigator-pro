-- Reconstructed migration record for the already-applied remote version 20261010094933.
-- Camera IDs are provisional tracking IDs and must be checked against the college NVR inventory.
-- The remote version is already applied; do not run this manually against production.

INSERT INTO public.camera_configs (camera_id, ip_address, stream_url)
SELECT 'CAM-' || lpad(n::text, 2, '0'), '', ''
FROM generate_series(1, 109) AS n
ON CONFLICT (camera_id) DO NOTHING;
