import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, CheckCircle, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { useCaregivers } from '@/hooks/useCaregivers';

export default function CaregiverAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { acceptInvite } = useCaregivers();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      handleAccept();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    const success = await acceptInvite(token);
    setStatus(success ? 'success' : 'error');

    if (success) {
      setTimeout(() => {
        navigate('/hoje');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <UserPlus className="h-12 w-12 mx-auto text-primary animate-pulse" />
              <h2 className="text-2xl font-bold">Aceitando convite...</h2>
              <p className="text-muted-foreground">Aguarde um momento</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold">Convite aceito!</h2>
              <p className="text-muted-foreground">
                Você agora é um cuidador autorizado. Redirecionando...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-2xl font-bold">Erro ao aceitar convite</h2>
              <p className="text-muted-foreground">
                O link pode estar expirado ou já foi usado.
              </p>
              <Button onClick={() => navigate('/auth')} className="mt-4">
                Fazer Login
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
