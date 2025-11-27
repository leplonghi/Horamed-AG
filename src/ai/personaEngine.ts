// Persona-based text shaping engine

export type PersonaType = 'elderly' | 'young' | 'bariatric' | 'athlete' | 'default';

export interface PersonaConfig {
  type: PersonaType;
  guidance: string;
}

export function getPersonaFromAge(age?: number): PersonaType {
  if (!age) return 'default';
  if (age >= 65) return 'elderly';
  if (age >= 18 && age < 35) return 'young';
  return 'default';
}

export function buildPersonaGuidance(persona: PersonaType): string {
  switch (persona) {
    case 'elderly':
      return `
PERSONA: Idoso
- Use frases MUITO curtas (máximo 2 linhas)
- Passos simples e numerados
- Ritmo calmo e paciente
- Evite termos técnicos
- Seja extremamente claro
- Repita informações importantes
- Use tom acolhedor e respeitoso`;

    case 'young':
      return `
PERSONA: Jovem adulto
- Resposta rápida e direta
- Máximo 3-4 frases
- Tom motivacional e prático
- Pode usar emoji ocasional
- Foco em eficiência`;

    case 'bariatric':
      return `
PERSONA: Paciente bariátrico
- Foco em rotina + hidratação + proteínas
- Cuidado especial com GLP-1 e suplementação
- Zero julgamento
- Reforçar refeições pequenas e frequentes
- Tom de apoio e compreensão`;

    case 'athlete':
      return `
PERSONA: Atleta
- Foco em performance + segurança
- Horários otimizados para treino
- Atenção a interações medicamentosas
- Tom objetivo e técnico`;

    default:
      return `
PERSONA: Padrão
- Tom neutro e acolhedor
- Direto ao ponto
- Claro e simples`;
  }
}
