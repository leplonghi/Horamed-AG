import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCollection, where, orderBy, limit } from '@/integrations/firebase';
import { safeDateParse } from "@/lib/safeDateUtils";

/**
 * Hook para redirecionamento inteligente baseado em doses pendentes
 * Se hÃ¡ dose pendente nos prÃ³ximos 30 min ou atrasada, redireciona para /hoje
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
        const thirtyMinutesFromNow = safeDateParse(now.getTime() + 30 * 60 * 1000);

        // Check for pending doses in the next 30 minutes or already overdue
        // In Firebase, doses are in users/{userId}/doses
        const { data: doses, error } = await fetchCollection(
          "dose_instances",
          [where("userId", "==", user.uid), 
            where('status', '==', 'scheduled'),
            where('dueAt', '<=', thirtyMinutesFromNow.toISOString()), // Changed due_at to dueAt
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

