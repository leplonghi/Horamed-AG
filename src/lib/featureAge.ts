/**
import { safeDateParse } from "@/lib/safeDateUtils";
 * featureAge — determines if a feature was launched recently enough to show a "NEW" badge
 * Features are tracked by ID with their launch date.
 * Default threshold: 30 days.
 */

const FEATURE_LAUNCH_DATES: Record<string, string> = {
  side_effects_diary: '2026-03-01',
  travel_mode: '2026-03-01',
  rewards: '2025-12-01',
  drug_interactions: '2026-02-01',
  emergency_card: '2026-04-06',
  anvisa_lookup: '2026-04-06',
};

export function isFeatureNew(featureId: string, daysThreshold = 30): boolean {
  const launchDate = FEATURE_LAUNCH_DATES[featureId];
  if (!launchDate) return false;
  const diffDays = (Date.now() - safeDateParse(launchDate).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= daysThreshold;
}

export function getFeatureLaunchDate(featureId: string): Date | null {
  const d = FEATURE_LAUNCH_DATES[featureId];
  return d ? safeDateParse(d) : null;
}
