import { toast } from "sonner";

type FeedbackType = 
  | "dose-taken"
  | "dose-taken-perfect"
  | "dose-taken-streak"
  | "dose-skipped"
  | "dose-missed"
  | "dose-snoozed"
  | "period-complete"
  | "streak-achieved"
  | "medication-added"
  | "document-uploaded"
  | "reminder-set";

interface FeedbackOptions {
  medicationName?: string;
  streakDays?: number;
  takenTime?: string;
  periodName?: string;
  customMessage?: string;
}

export const useFeedbackToast = () => {
  const showFeedback = (type: FeedbackType, options?: FeedbackOptions) => {
    const messages = {
      "dose-taken": {
        title: "✅ Ótimo!",
        description: options?.medicationName 
          ? `${options.medicationName} tomado${options.takenTime ? ` às ${options.takenTime}` : ''}`
          : "Dose marcada como tomada!",
        duration: 3000,
      },
      "dose-taken-perfect": {
        title: "🎉 Perfeito!",
        description: options?.medicationName
          ? `${options.medicationName} tomado no horário certo!`
          : "Você está mantendo sua rotina em dia!",
        duration: 4000,
      },
      "dose-taken-streak": {
        title: `🔥 ${options?.streakDays || 0} dias seguidos!`,
        description: "Você está arrasando! Continue assim.",
        duration: 5000,
      },
      "period-complete": {
        title: "⭐ Todas as doses tomadas!",
        description: options?.periodName 
          ? `Parabéns! Você completou todas as doses da ${options.periodName}.`
          : "Você completou todas as doses deste período!",
        duration: 5000,
      },
      "dose-skipped": {
        title: "Dose pulada",
        description: "Registrado. Tente retomar amanhã.",
        duration: 3000,
      },
      "dose-missed": {
        title: "Dose registrada como esquecida",
        description: "Sua saúde é importante! Vamos continuar juntos.",
        duration: 4000,
      },
      "dose-snoozed": {
        title: "⏰ Lembrete adiado",
        description: "Vamos te lembrar em 15 minutos.",
        duration: 3000,
      },
      "streak-achieved": {
        title: `🔥 ${options?.streakDays || 7} dias seguidos!`,
        description: "Continue assim! Você está no caminho certo.",
        duration: 5000,
      },
      "medication-added": {
        title: "🎉 Medicamento adicionado!",
        description: options?.medicationName
          ? `${options.medicationName} foi adicionado à sua rotina.`
          : "Novo medicamento adicionado à sua rotina.",
        duration: 3000,
      },
      "document-uploaded": {
        title: "📄 Documento salvo",
        description: "Seu documento foi guardado com segurança na Carteira.",
        duration: 3000,
      },
      "reminder-set": {
        title: "🔔 Lembrete configurado",
        description: "Você receberá notificações nos horários definidos.",
        duration: 3000,
      },
    };

    const message = messages[type];

    if (options?.customMessage) {
      toast.success(options.customMessage);
    } else {
      toast.success(message.title, {
        description: message.description,
        duration: message.duration,
      });
    }
  };

  return { showFeedback };
};
