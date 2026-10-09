export interface CameraRegistryEntry {
  id: string;
  label: string;
  mappingStatus: "pending";
  locationLabel: "Awaiting annotated floor layout";
}

export const CAMPUS_REPORTED_CAMERA_COUNT = 109;

/** Temporary tracking IDs, not verified NVR labels or physical locations. */
export const cameraRegistry: CameraRegistryEntry[] = Array.from(
  { length: CAMPUS_REPORTED_CAMERA_COUNT },
  (_, index) => {
    const id = `CAM-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      label: id,
      mappingStatus: "pending" as const,
      locationLabel: "Awaiting annotated floor layout" as const,
    };
  },
);
