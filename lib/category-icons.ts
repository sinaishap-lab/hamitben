// Tool-category icons. Category.icon stores one of these string keys;
// getCategoryIcon resolves it to a lucide component. CATEGORY_ICON_KEYS
// drives the icon picker in the admin category manager.
import {
  Droplets,
  Wheat,
  Shovel,
  SprayCan,
  Sprout,
  Package,
  Truck,
  Wrench,
  Hammer,
  Scissors,
  Leaf,
  TreePine,
  Sun,
  Axe,
  Drill,
  Box,
  Boxes,
  Pickaxe,
  Container,
  Flower,
  Carrot,
  Tractor,
  Tag,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

/** lucide icon key → component. Keys are stored verbatim in Category.icon. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Droplets,
  Wheat,
  Shovel,
  SprayCan,
  Sprout,
  Package,
  Truck,
  Wrench,
  Hammer,
  Scissors,
  Leaf,
  TreePine,
  Sun,
  Axe,
  Drill,
  Box,
  Boxes,
  Pickaxe,
  Container,
  Flower,
  Carrot,
  Tractor,
  Tag,
  MoreHorizontal,
};

/** Fallback icon when a category has no/invalid icon key. */
export const DEFAULT_CATEGORY_ICON = "Tag";

/** Ordered list of icon keys — used by the admin icon picker. */
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

/** Resolve a stored icon key to a lucide component, with a safe fallback. */
export function getCategoryIcon(key: string | null | undefined): LucideIcon {
  if (key && CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  return CATEGORY_ICONS[DEFAULT_CATEGORY_ICON];
}
