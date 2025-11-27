// Main Health Agent orchestrator

import { classifyIntent, Intent } from './intentEngine';
import { buildPersonaGuidance, PersonaType } from './personaEngine';
import { buildMedicationPrompt, MedicationContext } from './handlers/medicationHandler';
import { buildStockPrompt, StockContext } from './handlers/stockHandler';
import { buildDocumentPrompt, DocumentContext } from './handlers/documentHandler';
import { buildGlp1Prompt } from './handlers/glp1Handler';
import { buildBariatricPrompt } from './handlers/bariatricHandler';
import { buildNavigationPrompt } from './handlers/navigationHandler';
import { buildInsightPrompt, InsightContext } from './handlers/insightHandler';
import { buildGenericPrompt } from './handlers/genericHandler';

export interface UserContext {
  age?: number;
  personaType: PersonaType;
  activeMedications: any[];
  stockData: any[];
  documents: any[];
  planType: 'free' | 'premium';
  aiUsageToday: number;
  adherenceRate?: number;
  streakDays?: number;
  totalDoses?: number;
  takenDoses?: number;
}

export function buildSystemPrompt(intent: Intent, persona: PersonaType, context: UserContext): string {
  const basePrompt = `Você é o HoraMed Health Agent, um assistente de saúde especializado em organização de rotinas, medicamentos, suplementos e documentos de saúde.

REGRAS GLOBAIS:
- Sempre responda em português brasileiro natural e humano
- Nunca prescreva medicamentos ou dê diagnósticos
- Seja acolhedor, empático e simples
- Foque em organização, educação e segurança
- Use frases curtas e diretas
- Seja específico e prático

${buildPersonaGuidance(persona)}`;

  let intentPrompt = '';

  switch (intent) {
    case 'MEDICATION_INTENT':
      intentPrompt = buildMedicationPrompt({ 
        activeMedications: context.activeMedications 
      } as MedicationContext);
      break;

    case 'STOCK_INTENT':
      intentPrompt = buildStockPrompt({ 
        stockData: context.stockData 
      } as StockContext);
      break;

    case 'DOCUMENT_INTENT':
      intentPrompt = buildDocumentPrompt({ 
        documents: context.documents 
      } as DocumentContext);
      break;

    case 'GLP1_INTENT':
      intentPrompt = buildGlp1Prompt();
      break;

    case 'BARIATRIC_INTENT':
      intentPrompt = buildBariatricPrompt();
      break;

    case 'NAVIGATION_INTENT':
      intentPrompt = buildNavigationPrompt();
      break;

    case 'INSIGHT_INTENT':
      intentPrompt = buildInsightPrompt({
        adherenceRate: context.adherenceRate,
        streakDays: context.streakDays,
        totalDoses: context.totalDoses,
        takenDoses: context.takenDoses
      } as InsightContext);
      break;

    case 'GENERIC_INTENT':
      intentPrompt = buildGenericPrompt();
      break;
  }

  return `${basePrompt}\n\n${intentPrompt}`;
}
