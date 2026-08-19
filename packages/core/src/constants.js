export const SUBJECTIVE_C_VERSION = "0.4.0-alpha.1";
export const MANIFEST_SCHEMA = "subjective-c/manifest@0.2";
export const VARIANT_SCHEMA = "subjective-c/variant@0.2";
export const REGISTRY_SCHEMA = "subjective-c/registry@0.1";
export const PLAN_SCHEMA = "subjective-c/plan@0.1";

export const CAPABILITY_KINDS = Object.freeze([
  "create", "search", "filter", "sort", "collaborate", "analytics",
  "activity", "compare", "import", "export", "communicate", "schedule",
  "settings", "browse", "custom"
]);

export const EXPERIENCE_LEVELS = Object.freeze(["novice", "returning", "expert"]);
export const DEVICE_CLASSES = Object.freeze(["mobile", "tablet", "desktop"]);
export const DENSITIES = Object.freeze(["comfortable", "balanced", "compact"]);
export const LAYOUTS = Object.freeze([
  "sidebar-workbench", "topbar-gallery", "editorial-split",
  "command-center", "focus-stack", "spatial-board"
]);
