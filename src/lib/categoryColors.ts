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
// softFrom/softTo → fundo suave do card (quase branco com leve tint)
// accentFrom/accentTo → gradiente do círculo do ícone (saturado)

const MEDICAMENTO_PALETTES = [
  { softFrom: "#e6f0ff", softTo: "#c7dfff", accentFrom: "#4a7fd4", accentTo: "#2f5fb0", text: "#1e3a6e" },
  { softFrom: "#e9edff", softTo: "#cad4ff", accentFrom: "#5b72e8", accentTo: "#3f58c8", text: "#1e2e6e" },
  { softFrom: "#e6f4ff", softTo: "#bde4ff", accentFrom: "#3a96d0", accentTo: "#2475b0", text: "#1a3a5a" },
  { softFrom: "#ebf0ff", softTo: "#c9d8ff", accentFrom: "#6887ee", accentTo: "#4a68cc", text: "#1e2e68" },
  { softFrom: "#e0f2ff", softTo: "#bce1ff", accentFrom: "#2d87d8", accentTo: "#1a69b8", text: "#1a3660" },
  { softFrom: "#e9edff", softTo: "#c7d4ff", accentFrom: "#7280ec", accentTo: "#5568d0", text: "#252060" },
];

const VITAMINA_PALETTES = [
  { softFrom: "#ebfff4", softTo: "#c2f7dc", accentFrom: "#28b578", accentTo: "#1a9460", text: "#0f4a2e" },
  { softFrom: "#e6fdf2", softTo: "#bff3db", accentFrom: "#36c48a", accentTo: "#24a070", text: "#0e4434" },
  { softFrom: "#eafff7", softTo: "#bdf4e5", accentFrom: "#22ad82", accentTo: "#168a65", text: "#0c3e30" },
  { softFrom: "#e6fdf0", softTo: "#bcf4d1", accentFrom: "#40c07a", accentTo: "#2a9e60", text: "#113a24" },
  { softFrom: "#f0fffa", softTo: "#ccfbee", accentFrom: "#2fc496", accentTo: "#1da078", text: "#0c3e30" },
  { softFrom: "#ebfff2", softTo: "#c4f2d7", accentFrom: "#32b068", accentTo: "#209050", text: "#0e3820" },
];

const SUPLEMENTO_PALETTES = [
  { softFrom: "#fff4e6", softTo: "#ffd8b1", accentFrom: "#e0874a", accentTo: "#c4672e", text: "#5a2e0e" },
  { softFrom: "#fff1e6", softTo: "#ffccaa", accentFrom: "#da6a3c", accentTo: "#be4e24", text: "#541c08" },
  { softFrom: "#fff9e6", softTo: "#ffd699", accentFrom: "#d89a40", accentTo: "#bc7c26", text: "#5a340a" },
  { softFrom: "#fff4f0", softTo: "#ffcdbc", accentFrom: "#cc7060", accentTo: "#b05048", text: "#4a1c18" },
  { softFrom: "#fff6e6", softTo: "#ffdbb5", accentFrom: "#d88a56", accentTo: "#bc6c3c", text: "#52280e" },
  { softFrom: "#fff1e6", softTo: "#ffc8b3", accentFrom: "#c86040", accentTo: "#ac4428", text: "#481808" },
];

const OUTRO_PALETTES = [
  { softFrom: "#edf2f7", softTo: "#cbd5e0", accentFrom: "#7890a8", accentTo: "#587090", text: "#2a3a4a" },
  { softFrom: "#f2f5f8", softTo: "#d1dbe5", accentFrom: "#6a82a0", accentTo: "#4e6888", text: "#283848" },
];

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

// ─── categoryColors mantido para compatibilidade com outros componentes ────────
export const categoryColors: Record<string, CategoryColorConfig> = {
  medicamento: {
    icon: Pill,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  vitamina: {
    icon: Leaf,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  },
  suplemento: {
    icon: Heart,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  },
  outro: {
    icon: Package,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    iconBg: "bg-gray-100 dark:bg-gray-900/50",
    badgeColor: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300",
  },
};

export const supplementCategoryColors: Record<string, CategoryColorConfig> = {
  energy: {
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  sleep: {
    icon: Moon,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  },
  immunity: {
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  performance: {
    icon: Dumbbell,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  hydration: {
    icon: Droplets,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
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
