// Voice Command Processor for HoraMed
// Processes voice commands and returns actions to execute

export type VoiceAction =
  | { type: 'NAVIGATE'; path: string; label?: string }
  | { type: 'ADD_MEDICATION'; name?: string; entities?: any }
  | { type: 'MARK_DOSE_TAKEN'; medicationName?: string; entities?: any }
  | { type: 'SKIP_DOSE'; medicationName?: string; entities?: any }
  | { type: 'CHECK_STOCK'; medicationName?: string; entities?: any }
  | { type: 'HEALTH_QUERY'; symptom?: string; entities?: any }
  | { type: 'OPEN_ASSISTANT'; query: string }
  | { type: 'OPEN_SEARCH' }
  | { type: 'UNKNOWN'; originalText: string; entities?: any };

interface ProcessedCommand {
  action: VoiceAction;
  confidence: 'high' | 'medium' | 'low';
  spokenResponse: string;
}

// Navigation mappings
const navigationPatterns: { patterns: RegExp[]; path: string; label: string }[] = [
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(hoje|início|home|principal)\b/i],
    path: '/',
    label: 'Página inicial'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(medicamentos?|remédios?|remedios?)\b/i],
    path: '/medicamentos',
    label: 'Medicamentos'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(agenda|calendário|calendario)\b/i],
    path: '/agenda',
    label: 'Agenda'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(cofre|documentos?)\b/i],
    path: '/cofre',
    label: 'Cofre de Documentos'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(saúde|saude|dashboard de saúde)\b/i],
    path: '/saude',
    label: 'Saúde'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(estoque)\b/i],
    path: '/estoque',
    label: 'Controle de Estoque'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(histórico|historico)\b/i],
    path: '/historico',
    label: 'Histórico'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(perfil|minha conta|configurações|configuracoes)\b/i],
    path: '/perfil',
    label: 'Perfil'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(carteira de vacina|vacinas?)\b/i],
    path: '/carteira-vacina',
    label: 'Carteira de Vacina'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(notificações|notificacoes|alertas)\b/i],
    path: '/notificacoes',
    label: 'Notificações'
  },
  {
    patterns: [/\b(ir para |abrir |ver |mostrar )?(progresso|conquistas|gamificação|gamificacao)\b/i],
    path: '/progresso',
    label: 'Progresso'
  },
];

// Action patterns
const actionPatterns = {
  addMedication: [
    /\b(adicionar|cadastrar|incluir|novo)\s+(medicamento|remédio|remedio|suplemento|vitamina)(?:\s+(.+))?/i,
    /\bquero\s+(adicionar|cadastrar)\s+(.+)/i,
  ],
  markDoseTaken: [
    /\b(tomei|tomado|confirmei|já tomei|marcar como tomad[oa]?)(?:\s+(.+))?/i,
    /\b(marcar|confirmar)\s+dose(?:\s+d[eo]\s+(.+))?/i,
  ],
  skipDose: [
    /\b(pular|pulei|skip|não vou tomar|nao vou tomar)(?:\s+(.+))?/i,
    /\b(adiar|depois)\s+dose(?:\s+d[eo]\s+(.+))?/i,
  ],
  checkStock: [
    /\b(verificar|checar|quanto tem|quantos dias|estoque)\s+d[eo]\s+(.+)/i,
    /\b(quanto|quantas?)\s+(.+)\s+(tenho|resta|sobra)/i,
  ],
  openSearch: [
    /\b(buscar|procurar|pesquisar)\b/i,
  ],
};

export function processVoiceCommand(transcript: string): ProcessedCommand {
  const text = transcript.toLowerCase().trim();

  if (!text) {
    return {
      action: { type: 'UNKNOWN', originalText: transcript },
      confidence: 'low',
      spokenResponse: 'Não entendi o comando. Pode repetir?'
    };
  }

  // Check navigation patterns first
  for (const nav of navigationPatterns) {
    for (const pattern of nav.patterns) {
      if (pattern.test(text)) {
        return {
          action: { type: 'NAVIGATE', path: nav.path, label: nav.label },
          confidence: 'high',
          spokenResponse: `Abrindo ${nav.label}`
        };
      }
    }
  }

  // Check add medication
  for (const pattern of actionPatterns.addMedication) {
    const match = text.match(pattern);
    if (match) {
      const medicationName = match[3] || match[2];
      return {
        action: { type: 'ADD_MEDICATION', name: medicationName?.trim() },
        confidence: 'high',
        spokenResponse: medicationName
          ? `Vou adicionar ${medicationName}`
          : 'Abrindo formulário para adicionar medicamento'
      };
    }
  }

  // Check mark dose taken
  for (const pattern of actionPatterns.markDoseTaken) {
    const match = text.match(pattern);
    if (match) {
      const medicationName = match[2];
      return {
        action: { type: 'MARK_DOSE_TAKEN', medicationName: medicationName?.trim() },
        confidence: 'high',
        spokenResponse: medicationName
          ? `Marcando dose de ${medicationName} como tomada`
          : 'Marcando dose como tomada'
      };
    }
  }

  // Check skip dose
  for (const pattern of actionPatterns.skipDose) {
    const match = text.match(pattern);
    if (match) {
      const medicationName = match[2];
      return {
        action: { type: 'SKIP_DOSE', medicationName: medicationName?.trim() },
        confidence: 'medium',
        spokenResponse: medicationName
          ? `Pulando dose de ${medicationName}`
          : 'Pulando dose'
      };
    }
  }

  // Check stock
  for (const pattern of actionPatterns.checkStock) {
    const match = text.match(pattern);
    if (match) {
      const medicationName = match[2];
      return {
        action: { type: 'CHECK_STOCK', medicationName: medicationName?.trim() },
        confidence: 'high',
        spokenResponse: `Verificando estoque de ${medicationName}`
      };
    }
  }

  // Check search
  for (const pattern of actionPatterns.openSearch) {
    if (pattern.test(text)) {
      return {
        action: { type: 'OPEN_SEARCH' },
        confidence: 'high',
        spokenResponse: 'Abrindo busca'
      };
    }
  }

  // Check Simple Health Queries
  const healthPatterns = [
    /\b(dor de cabeça|estou com|sinto|sentindo)\b/i,
    /\b(tontura|enjoo|febre|gripe)\b/i
  ];
  for (const pattern of healthPatterns) {
    if (pattern.test(text)) {
      return {
        action: { type: 'HEALTH_QUERY', symptom: text, entities: { symptom: text } },
        confidence: 'medium',
        spokenResponse: 'Vou abrir a análise de saúde.'
      };
    }
  }

  // If no specific command found, treat as assistant query
  return {
    action: { type: 'OPEN_ASSISTANT', query: transcript },
    confidence: 'medium',
    spokenResponse: 'Vou consultar o assistente sobre isso'
  };
}

// Text-to-speech function
export function speak(text: string, lang: string = 'pt-BR'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      resolve(); // Don't reject, just continue
    };

    window.speechSynthesis.speak(utterance);
  });
}
