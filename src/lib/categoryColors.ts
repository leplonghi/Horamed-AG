import { Pill, Leaf, Heart, Package, Zap, Moon, Shield, Dumbbell, Droplets } from "lucide-react";

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
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
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

export function getCategoryColors(category?: string | null): CategoryColorConfig {
  if (!category) return categoryColors.medicamento;
  return categoryColors[category] || categoryColors.medicamento;
}

export function getSupplementCategoryColors(supplementCategory?: string | null): CategoryColorConfig | null {
  if (!supplementCategory) return null;
  return supplementCategoryColors[supplementCategory] || null;
}
