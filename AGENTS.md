# Project architecture

- Keep map viewport interaction state in `FloorPlanSVG` as one scale-and-translation view; centered zoom and bounded panning share the same map dimensions so floor-plan geometry remains untouched.