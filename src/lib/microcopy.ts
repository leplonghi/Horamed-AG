/**
 * HoraMed — Microcopy Oficial
 * Fonte única de verdade para linguagem do app
 * Versão: 2.0
 */

export const microcopy = {
  brand: {
    tagline: "Sua rotina de saúde, sem esquecimentos.",
    toneNote:
      "Linguagem empática, profissional e calma. Nunca julgar, nunca culpar."
  },

  onboarding: {
    welcomeTitle: "Vamos começar com o básico",
    welcomeSubtitle: "Em poucos passos, sua rotina fica mais organizada.",

    usageQuestion: "Como você quer usar o HoraMed?",

    usageOptions: {
      self: {
        title: "Para mim",
        description: "Vitaminas, suplementos e rotina diária"
      },
      other: {
        title: "Para outra pessoa",
        description: "Medicamentos e acompanhamento diário"
      }
    }
  },

  profile: {
    createTitle: "Quem você quer acompanhar?",
    createHelper:
      "Você pode criar perfis para você ou para alguém que você cuida.",

    nameLabel: "Nome (como você chama no dia a dia)",
    relationshipLabel: "Relação"
  },

  item: {
    addTitle: "O que faz parte da sua rotina de saúde?",
    nameLabel: "Nome",
    nameHelper: "Use um nome fácil de reconhecer no dia a dia.",

    categoryLabel: "Tipo",
    categoryHelper:
      "Isso ajuda o app a organizar melhor sua rotina.",

    categories: {
      medication: "Medicamento",
      vitamin: "Vitamina",
      supplement: "Suplemento",
      other: "Outro"
    }
  },

  schedule: {
    title: "Quando isso costuma fazer parte do seu dia?",
    timeLabel: "Horário",
    addAnother: "Adicionar outro horário"
  },

  dose: {
    notificationSelf: "É hora da sua dose.",
    notificationOther: (name: string) =>
      `Hora do medicamento de ${name}.`,

    confirmButton: "Confirmar dose",

    registered:
      "Dose registrada. Obrigado por confirmar.",

    notRegistered:
      "Essa dose ainda não foi registrada.",

    skippedFeedback:
      "Tudo bem. O importante é manter o acompanhamento.",

    actions: {
      confirmNow: "Confirmar agora",
      markSkipped: "Marcar como pulada"
    }
  },

  plan: {
    freeLimitReached:
      "Você chegou ao limite do plano gratuito.\n\nO plano Premium permite acompanhar toda a sua rotina sem restrições.",

    premiumTitle:
      "Sua rotina de saúde merece constância.",

    premiumSubtitle:
      "Com o Premium, você acompanha tudo com mais tranquilidade.",

    ctaUpgrade: "Conhecer o Premium"
  },

  feedback: {
    genericError:
      "Algo não saiu como esperado. Tente novamente em instantes.",

    loading:
      "Carregando informações…"
  },

  notifications: {
    gentleReminder:
      "Você pode confirmar a dose agora.",

    dailySummary:
      "Acompanhamento do dia atualizado."
  },

  ai: {
    disclaimer:
      "Posso explicar de forma simples, mas isso não substitui a orientação de um profissional de saúde.",

    fallback:
      "Posso ajudar explicando melhor ou organizando sua rotina."
  },

  // Help tooltips - textos de ajuda contextual
  help: {
    // Página Hoje
    today: {
      streak: "Quantos dias seguidos você tomou todos os medicamentos. Quanto maior, melhor!",
      progress: "Porcentagem de doses tomadas hoje. Meta: 100%!",
      overdue: "Doses que passaram do horário mas ainda podem ser tomadas.",
      upcoming: "Suas próximas doses programadas para hoje."
    },

    // Página Medicamentos
    medications: {
      search: "Digite o nome do medicamento para filtrar a lista.",
      stock: "Quantidade restante do medicamento. Avisamos quando estiver acabando.",
      schedule: "Quantas vezes por dia você toma este medicamento.",
      category: "Tipo do item: medicamento, vitamina, suplemento ou outro."
    },

    // Estoque
    stock: {
      daysRemaining: "Previsão de quando o estoque vai acabar, baseado no seu uso.",
      refill: "Adicione unidades quando comprar mais medicamentos.",
      consumption: "Histórico de uso nos últimos 7 dias.",
      alert: "Alertas aparecem quando o estoque está baixo."
    },

    // Carteira de Saúde
    cofre: {
      document: "Guarde receitas, exames, vacinas e consultas aqui.",
      review: "Documentos que precisam da sua confirmação após leitura automática.",
      expiring: "Documentos com validade próxima do vencimento.",
      share: "Compartilhe documentos com médicos ou familiares de forma segura."
    },

    // Progresso
    progress: {
      adherence: "Porcentagem de doses tomadas no período. Acima de 80% é excelente!",
      onTime: "Porcentagem de doses tomadas no horário certo (até 15min de atraso).",
      milestone: "Conquistas desbloqueadas pela sua dedicação.",
      xp: "Pontos de experiência ganhos ao tomar doses e manter sequências."
    },

    // Perfil
    profile: {
      familyProfiles: "Crie perfis separados para cada pessoa que você cuida.",
      notifications: "Configure como e quando receber lembretes.",
      biometric: "Use impressão digital ou Face ID para acessar o app mais rápido.",
      premium: "Desbloqueie recursos ilimitados e relatórios avançados."
    },

    // Wizard de medicamento
    wizard: {
      name: "Digite o nome do medicamento como está na caixa ou receita.",
      dose: "Quantidade que você toma por vez (ex: 1 comprimido, 10ml).",
      times: "Horários em que você precisa tomar este medicamento.",
      stock: "Quantas unidades você tem agora? Avisamos quando estiver acabando."
    }
  },

  // Tutoriais contextuais
  tutorials: {
    today: {
      id: "today_page",
      title: "Seu dia de saúde 💊",
      message: "Aqui você vê todas as doses do dia. Toque no botão ✓ para confirmar que tomou, ou segure para mais opções. Mantenha sua sequência de dias!"
    },
    medications: {
      id: "medications_page",
      title: "Gerencie seus medicamentos 💊",
      message: "Aqui você organiza todos os seus remédios, vitaminas e suplementos. Adicione novos itens, configure horários e acompanhe seu estoque."
    },
    stock: {
      id: "stock_page",
      title: "Controle de estoque 📦",
      message: "O sistema calcula automaticamente quando seus medicamentos vão acabar. Atualize o estoque quando comprar mais e nunca fique sem."
    },
    cofre: {
      id: "carteira_page",
      title: "Carteira de saúde 🏥",
      message: "Guarde exames, receitas, vacinas e consultas. Compartilhe com médicos quando precisar. Tudo seguro e organizado."
    },
    progress: {
      id: "progress_page",
      title: "Seu progresso 📈",
      message: "Acompanhe sua evolução com estatísticas, sequências e conquistas. Cada dose tomada conta para o seu sucesso!"
    },
    wizard: {
      id: "medication_wizard",
      title: "Adicionar medicamento ➕",
      message: "Preencha o nome, horários e estoque. É rápido! Em 3 passos seu medicamento está configurado e você será lembrado."
    }
  },

  // Empty states
  emptyStates: {
    today: {
      title: "Sem doses agora",
      message: "Você será notificado nos próximos horários.",
      cta: "Adicionar medicamento"
    },
    medications: {
      title: "Nenhum medicamento cadastrado",
      message: "Adicione seu primeiro medicamento. É rápido e nós avisamos nos horários.",
      cta: "Adicionar primeiro item"
    },
    cofre: {
      title: "Carteira vazia",
      message: "Guarde receitas e exames aqui. A leitura é automática.",
      cta: "Adicionar documento"
    },
    stock: {
      title: "Sem controle de estoque",
      message: "Configure o estoque dos seus medicamentos para receber alertas antes de acabar.",
      cta: "Configurar estoque"
    }
  }
};

export type Microcopy = typeof microcopy;
