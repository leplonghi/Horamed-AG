import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .single();

    // Premium has unlimited usage
    if (subscription?.plan_type === 'premium' && subscription?.status === 'active') {
      return { allowed: true, usageCount: 0 };
    }

    // Free users: check daily limit (2/day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('app_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_agent_query')
      .gte('created_at', today.toISOString());

    const usageCount = count || 0;

    if (usageCount >= 2) {
      return { allowed: false, usageCount };
    }

    return { allowed: true, usageCount };
  };

  // Log AI usage
  const logUsage = async () => {
    if (!user) return;

    await supabase
      .from('app_metrics')
      .insert({
        user_id: user.id,
        event_name: 'ai_agent_query',
        event_data: { timestamp: new Date().toISOString() }
      });
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('birth_date')
      .eq('user_id', user.id)
      .single();

    const age = profile?.birth_date 
      ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
      : undefined;

    // Determine persona
    const personaType: PersonaType = getPersonaFromAge(age);

    // Get active medications
    const { data: medications } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get stock data
    const { data: stock } = await supabase
      .from('stock')
      .select(`
        *,
        items:item_id (
          name
        )
      `)
      .not('item_id', 'is', null);

    const stockData = stock?.map(s => ({
      ...s,
      item_name: (s.items as any)?.name || 'Desconhecido'
    })) || [];

    // Get documents count
    const { count: docCount } = await supabase
      .from('documentos_saude')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .single();

    const planType = subscription?.plan_type === 'premium' && subscription?.status === 'active'
      ? 'premium'
      : 'free';

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: usageCount } = await supabase
      .from('app_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_agent_query')
      .gte('created_at', today.toISOString());

    return {
      age,
      personaType,
      activeMedications: medications || [],
      stockData,
      documents: Array(docCount || 0).fill(null),
      planType,
      aiUsageToday: usageCount || 0
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

      // Call AI via edge function
      const { data, error } = await supabase.functions.invoke('health-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        }
      });

      if (error) throw error;

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
