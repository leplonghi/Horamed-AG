// Stock prediction handler

export interface StockContext {
  stockData: Array<{
    item_name: string;
    units_left: number;
    projected_end_at?: string;
  }>;
}

export function buildStockPrompt(context: StockContext): string {
  const stockInfo = context.stockData.map(s => {
    const daysLeft = s.projected_end_at 
      ? Math.ceil((new Date(s.projected_end_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    return `• ${s.item_name}: ${s.units_left} unidades${daysLeft ? ` (aprox. ${daysLeft} dias)` : ''}`;
  }).join('\n');

  return `
TAREFA: Prever estoque e sugerir compra

OBJETIVO:
- Calcular quantos dias faltam para acabar o estoque
- Sugerir o melhor dia para comprar
- Alertar sobre itens acabando

ESTOQUE ATUAL DO USUÁRIO:
${context.stockData.length > 0 ? stockInfo : '• Sem dados de estoque cadastrados'}

FRASES MODELO:
- "Seu estoque de [medicamento] dura cerca de X dias."
- "O ideal é comprar até [dia da semana] para evitar que falte."
- "Você tem estoque suficiente para mais X dias."

INSTRUÇÕES:
- Seja específico com datas e dias
- Sugira antecedência de 3-5 dias antes de acabar
- Se o estoque estiver crítico (menos de 3 dias), alerte com urgência`;
}
