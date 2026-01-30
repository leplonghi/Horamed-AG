import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { useToast } from '@/hooks/use-toast';

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
      const data = result.data as any;

      setCaregivers(data.caregivers || []);
    } catch (error: any) {
      console.error('Error loading caregivers:', error);
      toast({
        title: 'Erro ao carregar cuidadores',
        description: error.message,
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
      const data = result.data as any;

      toast({
        title: 'Convite enviado',
        description: 'O link de convite foi gerado com sucesso'
      });

      await loadCaregivers();
      return data;
    } catch (error: any) {
      console.error('Error inviting caregiver:', error);
      toast({
        title: 'Erro ao convidar cuidador',
        description: error.message,
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
    } catch (error: any) {
      console.error('Error revoking caregiver:', error);
      toast({
        title: 'Erro ao remover cuidador',
        description: error.message,
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
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      toast({
        title: 'Erro ao aceitar convite',
        description: error.message,
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
