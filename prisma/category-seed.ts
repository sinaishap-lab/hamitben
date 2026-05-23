// Default tool categories — seeded on a fresh DB (prisma/seed.ts) and used
// by the one-off enum→table backfill. `enumKey` maps the legacy ToolCategory
// enum value to the matching Category row; it is ignored once the enum is gone.
export const DEFAULT_CATEGORIES = [
  { enumKey: "IRRIGATION", name: "השקיה", icon: "Droplets", sortOrder: 1 },
  { enumKey: "HARVESTING", name: "קציר ואסיף", icon: "Wheat", sortOrder: 2 },
  { enumKey: "SOIL_WORK", name: "עיבוד קרקע", icon: "Shovel", sortOrder: 3 },
  { enumKey: "SPRAYING", name: "ריסוס", icon: "SprayCan", sortOrder: 4 },
  { enumKey: "PLANTING", name: "שתילה", icon: "Sprout", sortOrder: 5 },
  { enumKey: "STORAGE", name: "אחסון", icon: "Package", sortOrder: 6 },
  { enumKey: "VEHICLES", name: "רכבים", icon: "Truck", sortOrder: 7 },
  { enumKey: "HAND_TOOLS", name: "כלי יד", icon: "Wrench", sortOrder: 8 },
  { enumKey: "OTHER", name: "אחר", icon: "MoreHorizontal", sortOrder: 9 },
] as const;
