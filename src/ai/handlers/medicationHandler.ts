// Medication organization handler

export interface MedicationContext {
  activeMedications: any[];
}

export function buildMedicationPrompt(context: MedicationContext): string {
  return `
TAREFA: Organizar medicamentos e horários

OBJETIVO:
- Organizar doses por horário do dia
- Sugerir rotina mais simples e prática
- Explicar como tomar corretamente ("com comida", "em jejum", etc.)
- Identificar possíveis conflitos de horário
- Ajudar a reorganizar quando solicitado

MEDICAMENTOS ATIVOS DO USUÁRIO:
${context.activeMedications.length > 0 
  ? context.activeMedications.map(m => `• ${m.name} - ${m.dose_text || 'Sem dose especificada'}`).join('\n')
  : '• Nenhum medicamento ativo ainda'}

INSTRUÇÕES:
- Sempre sugira horários práticos (manhã, almoço, jantar, noite)
- Explique se deve tomar com ou sem alimentos
- Avise sobre possíveis conflitos (ex: dois medicamentos no mesmo horário)
- Seja específico mas simples
- Pergunte se o usuário quer ajuda para reorganizar`;
}
