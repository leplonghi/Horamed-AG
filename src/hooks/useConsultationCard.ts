import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { useToast } from '@/hooks/use-toast';

interface ConsultationCardResponse {
  token: string;
  url: string;
  expiresAt: string;
}

export function useConsultationCard() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCard = async (profileId?: string, hours: number = 48) => {
    setLoading(true);
    try {
      const consultationCardFn = httpsCallable(functions, 'consultationCard');
      const result = await consultationCardFn({
        action: 'create',
        profileId, // camelCase
        hours
      });
      const data = result.data as ConsultationCardResponse;

      toast({
        title: 'Cartão de consulta criado',
        description: `Válido por ${hours}h. Link expira automaticamente.`
      });

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao criar cartão',
        description: msg,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const viewCard = async (token: string) => {
    setLoading(true);
    try {
      const consultationCardFn = httpsCallable(functions, 'consultationCard');
      const result = await consultationCardFn({
        action: 'view',
        token
      });
      return result.data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao visualizar cartão',
        description: msg,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const revokeCard = async (token: string) => {
    setLoading(true);
    try {
      const consultationCardFn = httpsCallable(functions, 'consultationCard');
      await consultationCardFn({
        action: 'revoke',
        token
      });

      toast({
        title: 'Cartão revogado',
        description: 'O link não está mais acessível'
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao revogar cartão',
        description: msg,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createCard,
    viewCard,
    revokeCard
  };
}
