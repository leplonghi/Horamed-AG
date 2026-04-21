import { Pill, Leaf, Heart, Package, Lightning as Zap, Moon, Shield, Barbell as Dumbbell, Drop as Droplets } from "@phosphor-icons/react";

export type MedicationCategory = "medicamento" | "vitamina" | "suplemento" | "outro" | string;
export type SupplementCategory = "energy" | "sleep" | "immunity" | "performance" | "hydration" | string;

interface CategoryColorConfig {
  icon: typeof Pill;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  badgeColor: string;
}

// ─── Paletas por categoria ────────────────────────────────────────────────────
// Geradas programaticamente via HSL — alinhadas com o sistema de tokens CSS.
// softFrom/softTo → fundo suave do card  |  accentFrom/accentTo → ícone saturado
//
// Hues derivados dos tokens:
//   medicamento → --category-medicamento  ≈ 224°
//   vitamina    → --category-vitamina     ≈ 152°
//   suplemento  → --category-suplemento   ≈ 190° (teal) + variações quentes 25°
//   outro       → --category-outro        ≈ 220° (neutro)

interface PaletteEntry {
  softFrom: string;
  softTo: string;
  accentFrom: string;
  accentTo: string;
  text: string;
}

function generatePalette(
  hues: number[],
  softL = 96,
  accentS = 62,
  accentL = 52,
): PaletteEntry[] {
  return hues.map((h, i) => ({
    softFrom:   `hsl(${h} 90% ${softL - i}%)`,
    softTo:     `hsl(${h} 85% ${softL - 6 - i}%)`,
    accentFrom: `hsl(${h} ${accentS}% ${accentL - i * 2}%)`,
    accentTo:   `hsl(${h} ${accentS - 4}% ${accentL - 10 - i * 2}%)`,
    text:       `hsl(${h} 55% ${28 - i * 2}%)`,
  }));
}

const MEDICAMENTO_PALETTES = generatePalette([213, 228, 204, 222, 200, 233]);
const VITAMINA_PALETTES    = generatePalette([148, 150, 152, 154, 156, 150], 96, 60, 44);
const SUPLEMENTO_PALETTES  = generatePalette([25, 22, 32, 20, 28, 18], 96, 68, 56);
const OUTRO_PALETTES       = generatePalette([210, 215], 95, 22, 52);

const CATEGORY_PALETTE_MAP: Record<string, typeof MEDICAMENTO_PALETTES> = {
  medicamento: MEDICAMENTO_PALETTES,
  vitamina: VITAMINA_PALETTES,
  suplemento: SUPLEMENTO_PALETTES,
  outro: OUTRO_PALETTES,
};

const CATEGORY_ICON_MAP: Record<string, typeof Pill> = {
  medicamento: Pill,
  vitamina: Leaf,
  suplemento: Heart,
  outro: Package,
};

// ─── categoryColors — usa tokens semânticos do design system ─────────────────
// Substitui classes Tailwind hardcoded (blue-600, green-600, teal-600, gray-600)
// por tokens definidos em index.css e tailwind.config.ts via --category-*.
export const categoryColors: Record<string, CategoryColorConfig> = {
  medicamento: {
    icon: Pill,
    color:       "text-category-medicamento",
    bgColor:     "bg-category-medicamento-muted dark:bg-category-medicamento/10",
    borderColor: "border-category-medicamento/25 dark:border-category-medicamento/30",
    iconBg:      "bg-category-medicamento/10 dark:bg-category-medicamento/20",
    badgeColor:  "bg-category-medicamento/10 text-category-medicamento",
  },
  vitamina: {
    icon: Leaf,
    color:       "text-category-vitamina",
    bgColor:     "bg-category-vitamina-muted dark:bg-category-vitamina/10",
    borderColor: "border-category-vitamina/25 dark:border-category-vitamina/30",
    iconBg:      "bg-category-vitamina/10 dark:bg-category-vitamina/20",
    badgeColor:  "bg-category-vitamina/10 text-category-vitamina",
  },
  suplemento: {
    icon: Heart,
    color:       "text-category-suplemento",
    bgColor:     "bg-category-suplemento-muted dark:bg-category-suplemento/10",
    borderColor: "border-category-suplemento/25 dark:border-category-suplemento/30",
    iconBg:      "bg-category-suplemento/10 dark:bg-category-suplemento/20",
    badgeColor:  "bg-category-suplemento/10 text-category-suplemento",
  },
  outro: {
    icon: Package,
    color:       "text-category-outro",
    bgColor:     "bg-category-outro-muted dark:bg-category-outro/10",
    borderColor: "border-category-outro/25 dark:border-category-outro/30",
    iconBg:      "bg-category-outro/10 dark:bg-category-outro/20",
    badgeColor:  "bg-category-outro/10 text-category-outro",
  },
};

// ─── supplementCategoryColors — usa tokens --supplement-* ────────────────────
export const supplementCategoryColors: Record<string, CategoryColorConfig> = {
  energy: {
    icon: Zap,
    color:       "text-supplement-energy",
    bgColor:     "bg-supplement-energy-muted dark:bg-supplement-energy/10",
    borderColor: "border-supplement-energy/25 dark:border-supplement-energy/30",
    iconBg:      "bg-supplement-energy/10 dark:bg-supplement-energy/20",
    badgeColor:  "bg-supplement-energy/10 text-supplement-energy",
  },
  sleep: {
    icon: Moon,
    color:       "text-supplement-sleep",
    bgColor:     "bg-supplement-sleep-muted dark:bg-supplement-sleep/10",
    borderColor: "border-supplement-sleep/25 dark:border-supplement-sleep/30",
    iconBg:      "bg-supplement-sleep/10 dark:bg-supplement-sleep/20",
    badgeColor:  "bg-supplement-sleep/10 text-supplement-sleep",
  },
  immunity: {
    icon: Shield,
    color:       "text-supplement-immunity",
    bgColor:     "bg-supplement-immunity-muted dark:bg-supplement-immunity/10",
    borderColor: "border-supplement-immunity/25 dark:border-supplement-immunity/30",
    iconBg:      "bg-supplement-immunity/10 dark:bg-supplement-immunity/20",
    badgeColor:  "bg-supplement-immunity/10 text-supplement-immunity",
  },
  performance: {
    icon: Dumbbell,
    color:       "text-supplement-performance",
    bgColor:     "bg-supplement-performance-muted dark:bg-supplement-performance/10",
    borderColor: "border-supplement-performance/25 dark:border-supplement-performance/30",
    iconBg:      "bg-supplement-performance/10 dark:bg-supplement-performance/20",
    badgeColor:  "bg-supplement-performance/10 text-supplement-performance",
  },
  hydration: {
    icon: Droplets,
    color:       "text-supplement-hydration",
    bgColor:     "bg-supplement-hydration-muted dark:bg-supplement-hydration/10",
    borderColor: "border-supplement-hydration/25 dark:border-supplement-hydration/30",
    iconBg:      "bg-supplement-hydration/10 dark:bg-supplement-hydration/20",
    badgeColor:  "bg-supplement-hydration/10 text-supplement-hydration",
  },
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getCategoryColors(category?: string | null): CategoryColorConfig {
  if (!category) return categoryColors.medicamento;
  return categoryColors[category] || categoryColors.medicamento;
}

export function getUniqueItemColors(
  itemName: string,
  category?: string | null
): Omit<CategoryColorConfig, 'icon'> & {
  icon: typeof Pill;
  softFrom: string;
  softTo: string;
  accentFrom: string;
  accentTo: string;
  textColor: string;
} {
  const cat = category || "medicamento";
  const palette = CATEGORY_PALETTE_MAP[cat] ?? MEDICAMENTO_PALETTES;
  const idx = hashString(itemName) % palette.length;
  const entry = palette[idx];

  const base = categoryColors[cat] ?? categoryColors.medicamento;
  const Icon = CATEGORY_ICON_MAP[cat] ?? Pill;

  return {
    icon: Icon,
    softFrom: entry.softFrom,
    softTo: entry.softTo,
    accentFrom: entry.accentFrom,
    accentTo: entry.accentTo,
    textColor: entry.text,
    color: base.color,
    bgColor: base.bgColor,
    borderColor: base.borderColor,
    iconBg: base.iconBg,
    badgeColor: base.badgeColor,
  };
}

export function getSupplementCategoryColors(supplementCategory?: string | null): CategoryColorConfig | null {
  if (!supplementCategory) return null;
  return supplementCategoryColors[supplementCategory] || null;
}
