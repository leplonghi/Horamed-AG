// Health insights and analysis handler

export interface InsightContext {
  adherenceRate?: number;
  streakDays?: number;
  totalDoses?: number;
  takenDoses?: number;
}

export function buildInsightPrompt(context: InsightContext): string {
  return `
TAREFA: Trazer insights educacionais sobre saúde

OBJETIVO:
- Analisar padrões de adesão
- Identificar horários com mais atrasos
- Celebrar conquistas e progresso
- Sugerir melhorias práticas

DADOS DO USUÁRIO:
${context.adherenceRate ? `- Taxa de compromisso: ${Math.round(context.adherenceRate)}%` : ''}
${context.streakDays ? `- Sequência atual: ${context.streakDays} dias` : ''}
${context.totalDoses && context.takenDoses ? `- Doses tomadas: ${context.takenDoses}/${context.totalDoses}` : ''}

EXEMPLOS DE INSIGHTS:
- "Você tomou 86% das doses este mês - parabéns!"
- "Identifiquei atrasos após o almoço. Que tal um lembrete extra?"
- "Sua rotina está mais estável nas últimas 2 semanas."
- "Você manteve sua sequência por X dias - continue assim!"

INSTRUÇÕES:
- Sempre comece celebrando os acertos
- Seja específico com números quando possível
- Ofereça sugestões práticas para melhorar
- Use tom motivacional e positivo
- Nunca culpe ou julgue por doses perdidas`;
}
