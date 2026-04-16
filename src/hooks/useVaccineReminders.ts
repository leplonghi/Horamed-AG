import { auth, fetchCollection, where, orderBy } from "@/integrations/firebase";
import { differenceInDays, parseISO } from "date-fns";

import { useQuery } from "@tanstack/react-query";

export interface VaccineReminder {
  id: string;
  vaccineName: string;
  doseDescription: string | null;
  nextDoseDate: string;
  daysUntil: number;
  urgency: 'high' | 'medium' | 'low';
}

export function useVaccineReminders(profileId?: string) {
  return useQuery({
    queryKey: ["vaccine-reminders", profileId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      const limitStr = thirtyDaysFromNow.toISOString().split('T')[0];

      const constraints = [
        where("nextDoseDate", ">=", todayStr),
        where("nextDoseDate", "<=", limitStr),
        orderBy("nextDoseDate", "asc")
      ];

      if (profileId) {
        constraints.push(where("profileId", "==", profileId));
      }

      const { data, error } = await fetchCollection<any>(
        `users/${user.uid}/vaccination_records`,
        constraints
      );
      
      if (error) throw error;

      // Calcular dias até a próxima dose e nível de urgência
      const reminders: VaccineReminder[] = (data || []).map(vaccine => {
        const daysUntil = differenceInDays(parseISO(vaccine.nextDoseDate), now);
        let urgency: 'high' | 'medium' | 'low' = 'low';

        if (daysUntil <= 7) {
          urgency = 'high';
        } else if (daysUntil <= 15) {
          urgency = 'medium';
        }

        return {
          id: vaccine.id,
          vaccineName: vaccine.vaccineName,
          doseDescription: vaccine.doseDescription,
          nextDoseDate: vaccine.nextDoseDate,
          daysUntil,
          urgency
        };
      });

      return reminders;
    },
  });
}
