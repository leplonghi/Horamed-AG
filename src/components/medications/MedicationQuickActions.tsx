import {
  IconPlus as Plus,
  IconCamera as Camera,
  IconArchive as Package,
  IconCalendar as Calendar,
  IconPill as Pill,
  IconFileText as FileText
} from "@/components/icons/HoramedIcons";
import QuickActionsBase, { QuickAction } from "@/components/shared/QuickActionsBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationQuickActionsProps {
  onAddMedication: () => void;
  onScanPrescription: () => void;
  onViewStock: () => void;
  onViewSchedule: () => void;
}

export default function MedicationQuickActions({
  onAddMedication,
  onScanPrescription,
  onViewStock,
  onViewSchedule
}: MedicationQuickActionsProps) {
  const { language } = useLanguage();

  const actions: QuickAction[] = [
    {
      id: "add",
      icon: <Plus className="h-6 w-6" />,
      label: language === 'pt' ? 'Adicionar' : 'Add',
      color: "bg-primary/20",
      textColor: "text-primary font-black uppercase tracking-tighter",
      onClick: onAddMedication
    },
    {
      id: "scan",
      icon: <Camera className="h-6 w-6" />,
      label: language === 'pt' ? 'Escanear' : 'Scan',
      color: "bg-teal-500/20",
      textColor: "text-teal-600 font-black uppercase tracking-tighter",
      onClick: onScanPrescription
    },
    {
      id: "stock",
      icon: <Package className="h-6 w-6" />,
      label: language === 'pt' ? 'Estoque' : 'Stock',
      color: "bg-amber-500/20",
      textColor: "text-amber-600 font-black uppercase tracking-tighter",
      onClick: onViewStock
    },
    {
      id: "schedule",
      icon: <Calendar className="h-6 w-6" />,
      label: language === 'pt' ? 'Agenda' : 'Schedule',
      color: "bg-emerald-500/20",
      textColor: "text-emerald-600 font-black uppercase tracking-tighter",
      onClick: onViewSchedule
    }
  ];

  return <QuickActionsBase actions={actions} columns={4} className="mt-2" />;
}
