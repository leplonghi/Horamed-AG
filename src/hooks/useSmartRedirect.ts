import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, fetchCollection, where, orderBy, limit } from '@/integrations/firebase';

/**
 * Hook para redirecionamento inteligente baseado em doses pendentes
 * Se há dose pendente nos próximos 30 min ou atrasada, redireciona para /hoje
 */
export const useSmartRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  useEffect(() => {
    const checkPendingDoses = async () => {
      // Only check on app entry (landing pages like /perfil, /evolucao, etc)
      if (location.pathname === '/hoje' || location.pathname === '/medicamentos') {
        return;
      }

      try {
        if (!user) return;

        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Check for pending doses in the next 30 minutes or already overdue
        // In Firebase, doses are in users/{userId}/doses
        const { data: doses, error } = await fetchCollection(
          `users/${user.uid}/doses`,
          [
            where('status', '==', 'scheduled'),
            where('dueAt', '<=', thirtyMinutesFromNow), // Changed due_at to dueAt
            orderBy('dueAt', 'asc'),
            limit(1)
          ]
        );

        if (error) {
          console.error('Error checking pending doses:', error);
          return;
        }

        // If there's a pending dose, redirect to /hoje
        if (doses && doses.length > 0) {
          console.log('Pending dose found, redirecting to /hoje');
          navigate('/hoje', { replace: true });
        }
      } catch (error) {
        console.error('Error in smart redirect:', error);
      }
    };

    // Check after a short delay to allow page to load
    const timer = setTimeout(checkPendingDoses, 500);

    return () => clearTimeout(timer);
  }, [location.pathname, navigate, user]);
};
