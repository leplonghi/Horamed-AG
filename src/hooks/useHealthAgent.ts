import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, fetchCollection, fetchDocument, setDocument, where } from '@/integrations/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import { classifyIntent } from '@/ai/intentEngine';
import { getPersonaFromAge, PersonaType } from '@/ai/personaEngine';
import { buildSystemPrompt, UserContext } from '@/ai/healthAgent';
import { detectNavigationIntent } from '@/ai/handlers/navigationHandler';

export function useHealthAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  // Navigation helpers
  const handleNavigation = (route: string) => {
    navigate(route);
    toast.success('Abrindo para você!');
  };

  // Check AI usage limit
  const checkUsageLimit = async (): Promise<{ allowed: boolean; usageCount: number }> => {
    if (!user) return { allowed: false, usageCount: 0 };

    // Get subscription: users/{uid}/subscription/current
    const { data: subscription } = await fetchDocument<any>(
      `users/${user.uid}/subscription`,
      'current'
    );

    // Premium has unlimited usage
    if (subscription?.planType === 'premium' && subscription?.status === 'active') {
      return { allowed: true, usageCount: 0 };
    }

    // Free users: check daily limit (2/day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // In Firebase: appMetrics (global collection) filtered by userId
    const { data: metricsToday } = await fetchCollection<any>(
      'appMetrics',
      [
        where('userId', '==', user.uid),
        where('eventName', '==', 'ai_agent_query'),
        where('createdAt', '>=', today.toISOString())
      ]
    );

    const usageCount = metricsToday?.length || 0;

    if (usageCount >= 2) {
      return { allowed: false, usageCount };
    }

    return { allowed: true, usageCount };
  };

  // Log AI usage
  const logUsage = async () => {
    if (!user) return;

    const id = crypto.randomUUID();
    await setDocument(
      'appMetrics',
      id,
      {
        userId: user.uid,
        eventName: 'ai_agent_query',
        eventData: { timestamp: new Date().toISOString() },
        createdAt: new Date().toISOString()
      }
    );
  };

  // Get user context
  const getUserContext = async (): Promise<UserContext> => {
    if (!user) {
      return {
        personaType: 'default',
        activeMedications: [],
        stockData: [],
        documents: [],
        planType: 'free',
        aiUsageToday: 0
      };
    }

    // Get profile
    const { data: profile } = await fetchDocument<any>(
      `users/${user.uid}/profile`,
      'me'
    );

    const age = profile?.birthDate
      ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
      : undefined;

    // Determine persona
    const personaType: PersonaType = getPersonaFromAge(age);

    // Get active medications
    // users/{uid}/medications
    const { data: medications } = await fetchCollection<any>(
      `users/${user.uid}/medications`,
      [where('isActive', '==', true)]
    );

    // Get stock data
    // users/{uid}/stock (subcollection)
    const { data: stock } = await fetchCollection<any>(
      `users/${user.uid}/stock`
    );

    // Fetch related item names for stock (since no Join)
    // Optimization: fetch items in parallel or reuse fetched medications if overlap
    // For simplicity, we'll try to match with fetched medications or fetch individually
    const medMap = new Map((medications || []).map(m => [m.id, m]));

    // If stock item ID not in active medications, we might miss the name, but usually stock is for active meds.
    // If needed, we could fetch individual items.

    const stockData = (stock || []).map(s => ({
      ...s,
      item_name: medMap.get(s.itemId)?.name || 'Desconhecido' // itemName
    }));

    // Get documents count
    const { data: docs } = await fetchCollection<any>(
      `users/${user.uid}/documents`
    );
    const docCount = docs?.length || 0;

    // Get subscription
    const { data: subscription } = await fetchDocument<any>(
      `users/${user.uid}/subscription`,
      'current'
    );

    const planType = subscription?.planType === 'premium' && subscription?.status === 'active'
      ? 'premium'
      : 'free';

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: metricsToday } = await fetchCollection<any>(
      'appMetrics',
      [
        where('userId', '==', user.uid),
        where('eventName', '==', 'ai_agent_query'),
        where('createdAt', '>=', today.toISOString())
      ]
    );

    return {
      age,
      personaType,
      activeMedications: medications || [],
      stockData,
      documents: Array(docCount).fill(null),
      planType,
      aiUsageToday: metricsToday?.length || 0
    };
  };

  // Process query
  const processQuery = async (message: string): Promise<string | { limitReached: true }> => {
    if (!user) {
      return 'Por favor, faça login para usar o assistente.';
    }

    setIsProcessing(true);

    try {
      // Check usage limit
      const { allowed, usageCount } = await checkUsageLimit();
      if (!allowed) {
        setIsProcessing(false);
        return { limitReached: true };
      }

      // Check for navigation intent first
      const navAction = detectNavigationIntent(message);
      if (navAction && navAction.type === 'route' && navAction.target) {
        // Ask for confirmation before navigating
        const confirmMessage = `Posso abrir ${navAction.description} para você agora?`;
        handleNavigation(navAction.target);
        return confirmMessage;
      }

      // Get context
      const context = await getUserContext();

      // Classify intent
      const intent = classifyIntent(message);

      // Build system prompt
      let systemPrompt = buildSystemPrompt(intent, context.personaType, context);

      // Add fitness guidance if message mentions fitness keywords
      const fitnessKeywords = ['treino', 'academia', 'performance', 'vitamina', 'suplemento', 'energia', 'sono', 'ozempic', 'mounjaro', 'glp-1', 'glp1', 'bariátrica', 'bariátrico', 'peso', 'dieta'];
      const hasFitnessKeyword = fitnessKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );

      if (hasFitnessKeyword) {
        systemPrompt += `

ORIENTAÇÃO FITNESS E BEM-ESTAR:
- Se o usuário perguntar sobre treino, academia ou performance, forneça orientações contextuais simples
- Para vitaminas (D, B12, ferro) ou suplementos, sugira horários ideais (manhã, pós-treino, antes de dormir)
- Para Ozempic/Mounjaro/GLP-1: oriente sobre aplicação semanal, hidratação abundante (mínimo 2L/dia), refeições menores
- Para pós-bariátrica: reforce proteína (60-80g/dia), hidratação entre refeições, 5-6 refeições pequenas/dia
- NUNCA prescreva ou ajuste doses - sempre diga "Siga sempre as orientações do seu médico"
- Foco em organização da rotina e dicas práticas, não em prescrições médicas`;
      }

      // Call AI via cloud function
      const healthAssistantFn = httpsCallable(functions, 'healthAssistant');
      const result = await healthAssistantFn({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      });
      const data = result.data as any;

      // Log usage
      await logUsage();

      setIsProcessing(false);

      // Check for navigation commands in response
      const response = data?.response || 'Desculpe, não consegui processar sua solicitação.';

      return response;

    } catch (error) {
      console.error('Health agent error:', error);
      setIsProcessing(false);
      toast.error('Erro ao processar solicitação');
      return 'Desculpe, ocorreu um erro. Tente novamente.';
    }
  };

  return {
    processQuery,
    isProcessing
  };
}
