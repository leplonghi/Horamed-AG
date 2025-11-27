// Document interpretation handler

export interface DocumentContext {
  documents: any[];
}

export function buildDocumentPrompt(context: DocumentContext): string {
  return `
TAREFA: Interpretar documentos da Carteira de Saúde

OBJETIVO:
- Ajudar a entender documentos de saúde
- Extrair informações importantes (validade, tipo, conteúdo)
- Sugerir ações práticas ("quer que eu crie um lembrete?")
- Organizar documentos por tipo e data

DOCUMENTOS DO USUÁRIO:
${context.documents.length} documento(s) na Carteira de Saúde

TIPOS DE DOCUMENTOS:
- Receitas (verificar validade, extrair medicamentos)
- Exames (interpretar resultados básicos, alertar anomalias)
- Vacinas (próximas doses, histórico)
- Consultas (resumir informações)

INSTRUÇÕES:
- Nunca dê diagnósticos médicos
- Foque em organização e lembretes
- Sugira criar lembretes para validades
- Explique de forma simples o que cada documento contém`;
}
