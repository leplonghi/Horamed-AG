// Intent classification engine for HoraMed Health Agent

export type Intent = 
  | 'MEDICATION_INTENT'
  | 'STOCK_INTENT'
  | 'DOCUMENT_INTENT'
  | 'GLP1_INTENT'
  | 'BARIATRIC_INTENT'
  | 'NAVIGATION_INTENT'
  | 'INSIGHT_INTENT'
  | 'GENERIC_INTENT';

export function classifyIntent(message: string): Intent {
  const msg = message.toLowerCase();

  // GLP-1 keywords (highest priority for specific treatments)
  if (
    msg.includes('ozempic') || 
    msg.includes('mounjaro') || 
    msg.includes('semaglutida') || 
    msg.includes('glp-1') || 
    msg.includes('glp1') || 
    msg.includes('tireoide') ||
    msg.includes('aplicação') || 
    msg.includes('caneta')
  ) {
    return 'GLP1_INTENT';
  }

  // Bariatric keywords
  if (
    msg.includes('bariátrica') || 
    msg.includes('bariatrica') || 
    msg.includes('cirurgia') ||
    msg.includes('proteína') || 
    msg.includes('proteina') || 
    msg.includes('náusea') ||
    msg.includes('bypass') || 
    msg.includes('gastrectomia')
  ) {
    return 'BARIATRIC_INTENT';
  }

  // Stock keywords
  if (
    msg.includes('estoque') || 
    msg.includes('acabar') || 
    msg.includes('comprar') ||
    msg.includes('farmácia') || 
    msg.includes('farmacia') || 
    msg.includes('falta') ||
    msg.includes('quanto tempo') || 
    msg.includes('dias restantes')
  ) {
    return 'STOCK_INTENT';
  }

  // Document keywords
  if (
    msg.includes('receita') || 
    msg.includes('exame') || 
    msg.includes('carteira') ||
    msg.includes('documento') || 
    msg.includes('pdf') || 
    msg.includes('validade') ||
    msg.includes('resultado')
  ) {
    return 'DOCUMENT_INTENT';
  }

  // Navigation keywords (where/how to find features)
  if (
    msg.includes('como faço') || 
    msg.includes('onde') || 
    msg.includes('encontrar') ||
    msg.includes('adicionar') || 
    msg.includes('abra') || 
    msg.includes('abrir') ||
    msg.includes('ver') || 
    msg.includes('página') ||
    msg.includes('pagina') || 
    msg.includes('menu') ||
    msg.includes('aba')
  ) {
    return 'NAVIGATION_INTENT';
  }

  // Medication keywords
  if (
    msg.includes('medicamento') || 
    msg.includes('remédio') || 
    msg.includes('remedio') ||
    msg.includes('dose') || 
    msg.includes('horário') || 
    msg.includes('horario') ||
    msg.includes('tomar') || 
    msg.includes('suplemento') || 
    msg.includes('vitamina')
  ) {
    return 'MEDICATION_INTENT';
  }

  // Insight keywords
  if (
    msg.includes('insight') || 
    msg.includes('análise') || 
    msg.includes('analise') ||
    msg.includes('progresso') || 
    msg.includes('relatório') || 
    msg.includes('relatorio') ||
    msg.includes('estatística') || 
    msg.includes('estatistica')
  ) {
    return 'INSIGHT_INTENT';
  }

  return 'GENERIC_INTENT';
}
