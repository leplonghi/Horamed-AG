import {
  IconCalendar as Calendar,
  IconFile as FileText,
  IconHealth as Stethoscope,
  IconPlus as Plus,
  IconSparkles as Vaccine
} from "@/components/icons/HoramedIcons";
import QuickActionsBase, { QuickAction } from "@/components/shared/QuickActionsBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface HealthQuickActionsProps {
  onScheduleAppointment: () => void;
  onAddExam: () => void;
  onAddVaccine: () => void;
  onViewTimeline: () => void;
}

export default function HealthQuickActions({
  onScheduleAppointment,
  onAddExam,
  onAddVaccine,
  onViewTimeline
}: HealthQuickActionsProps) {
  const { language } = useLanguage();

  const actions: QuickAction[] = [
    {
      id: "appointment",
      icon: <Stethoscope className="h-5 w-5 text-blue-500" />,
      label: language === 'pt' ? 'Consulta' : 'Appointment',
      color: "bg-blue-500/10",
      onClick: onScheduleAppointment
    },
    {
      id: "exam",
      icon: <FileText className="h-5 w-5 text-green-500" />,
      label: language === 'pt' ? 'Exame' : 'Exam',
      color: "bg-green-500/10",
      onClick: onAddExam
    },
    {
      id: "vaccine",
      icon: <Vaccine className="h-5 w-5 text-teal-500" />,
      label: language === 'pt' ? 'Vacina' : 'Vaccine',
      color: "bg-teal-500/10",
      onClick: onAddVaccine
    },
    {
      id: "timeline",
      icon: <Calendar className="h-5 w-5 text-orange-500" />,
      label: language === 'pt' ? 'Linha do Tempo' : 'Timeline',
      color: "bg-orange-500/10",
      onClick: onViewTimeline
    }
  ];

  return <QuickActionsBase actions={actions} columns={4} />;
}
