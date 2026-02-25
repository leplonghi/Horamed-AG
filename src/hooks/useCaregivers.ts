import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { useToast } from '@/hooks/use-toast';

interface CaregiverListResponse {
  caregivers: Caregiver[];
}

interface CaregiverInviteResponse {
  token?: string;
  inviteUrl?: string;
}

interface Caregiver {
  id: string;
  emailOrPhone: string; // email_or_phone
  role: 'viewer' | 'helper';
  invitedAt: string; // invited_at
  acceptedAt: string | null; // accepted_at
  caregiverUserId: string | null; // caregiver_user_id
}

export function useCaregivers() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCaregivers = async () => {
    try {
      const caregiverInviteFn = httpsCallable(functions, 'caregiverInvite');
      const result = await caregiverInviteFn({ action: 'list' });
      const data = result.data as CaregiverListResponse;

      setCaregivers(data.caregivers || []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar cuidadores',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaregivers();
  }, []);

  const inviteCaregiver = async (emailOrPhone: string, role: 'viewer' | 'helper' = 'viewer') => {
    try {
      const caregiverInviteFn = httpsCallable(functions, 'caregiverInvite');
      const result = await caregiverInviteFn({
        action: 'create',
        emailOrPhone, // camelCase format for backend
        role
      });
      const data = result.data as CaregiverInviteResponse;

      toast({
        title: 'Convite enviado',
        description: 'O link de convite foi gerado com sucesso'
      });

      await loadCaregivers();
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao convidar cuidador',
        description: msg,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const revokeCaregiver = async (caregiverId: string) => {
    try {
      const caregiverInviteFn = httpsCallable(functions, 'caregiverInvite');
      await caregiverInviteFn({
        action: 'revoke',
        caregiverId
      });

      toast({
        title: 'Cuidador removido',
        description: 'O acesso foi revogado com sucesso'
      });

      await loadCaregivers();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao remover cuidador',
        description: msg,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      const caregiverInviteFn = httpsCallable(functions, 'caregiverInvite');
      await caregiverInviteFn({
        action: 'accept',
        token
      });

      toast({
        title: 'Convite aceito',
        description: 'Você agora é um cuidador autorizado'
      });

      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao aceitar convite',
        description: msg,
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    caregivers,
    loading,
    inviteCaregiver,
    revokeCaregiver,
    acceptInvite,
    refresh: loadCaregivers
  };
}
