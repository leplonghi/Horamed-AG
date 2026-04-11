import {
    IconProviders as Hospital,
    IconStethoscope as Stethoscope,
    IconEmergency as UserFocus,
    IconTestTube as Flask,
    IconMedications as Pill,
    IconEmergency as Tooth,
    IconShield as FirstAid,
} from "@/components/icons/HoramedIcons";
import type { ProviderCategory } from '@/types/healthProvider';

interface Props {
  category: ProviderCategory;
  size?: number;
  className?: string;
}

const ICON_MAP: Record<ProviderCategory, React.ElementType> = {
  hospital: Hospital,
  clinic:   Stethoscope,
  doctor:   UserFocus,
  lab:      Flask,
  pharmacy: Pill,
  dentist:  Tooth,
  other:    FirstAid,
};

export function ProviderCategoryIcon({ category, size = 20, className }: Props) {
  const Icon = ICON_MAP[category] ?? FirstAid;
  return <Icon className={className} style={{ width: size, height: size }} aria-hidden="true" />;
}
