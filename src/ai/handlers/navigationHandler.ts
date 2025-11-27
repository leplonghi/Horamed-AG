// Navigation and app guidance handler

export interface NavigationAction {
  type: 'route' | 'action' | 'info';
  target?: string;
  description: string;
}

export function buildNavigationPrompt(): string {
  return `
TAREFA: Ajudar a navegar no app HoraMed

OBJETIVO:
- Explicar onde encontrar cada recurso
- Guiar o usuário passo a passo
- Oferecer abrir páginas diretamente quando apropriado

ESTRUTURA DO APP:
1. Hoje (/hoje) - Timeline das doses do dia, doses atrasadas e perdidas
2. Rotina (/rotina) - Gerenciar medicamentos, suplementos e estoque
3. Progresso (/progresso) - Métricas, relatórios e conquistas
4. Carteira de Saúde (/carteira-saude) - Documentos organizados
5. Perfil (/perfil) - Conta, configurações e indicações

AÇÕES COMUNS:
- Ver estoque: "Vá na aba Rotina e toque no medicamento"
- Adicionar medicamento: "Use o botão + na aba Rotina"
- Ver documentos: "Abra a aba Carteira de Saúde"
- Ver progresso: "Acesse a aba Progresso"
- Indicar amigos: "Vá em Perfil > Indique e Ganhe"
- Adicionar perfil familiar: "Em Perfil, toque em 'Adicionar perfil'"

INSTRUÇÕES:
- Sempre pergunte se o usuário quer que você abra a página diretamente
- Use frases como: "Posso abrir para você agora, se quiser."
- Seja específico sobre onde clicar
- Ofereça ajuda adicional após guiar`;
}

export function detectNavigationIntent(message: string): NavigationAction | null {
  const msg = message.toLowerCase();

  // Route detection
  if (msg.includes('estoque')) {
    return { type: 'route', target: '/rotina', description: 'Ver estoque de medicamentos' };
  }
  if (msg.includes('carteira') || msg.includes('documento')) {
    return { type: 'route', target: '/carteira-saude', description: 'Abrir Carteira de Saúde' };
  }
  if (msg.includes('progresso') || msg.includes('relatório')) {
    return { type: 'route', target: '/progresso', description: 'Ver progresso e relatórios' };
  }
  if (msg.includes('perfil') || msg.includes('indicar')) {
    return { type: 'route', target: '/perfil', description: 'Abrir perfil' };
  }
  if (msg.includes('hoje') || msg.includes('doses')) {
    return { type: 'route', target: '/hoje', description: 'Ver doses de hoje' };
  }

  return null;
}
