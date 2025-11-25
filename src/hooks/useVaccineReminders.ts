import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";

export interface VaccineReminder {
  id: string;
  vaccine_name: string;
  dose_description: string | null;
  next_dose_date: string;
  daysUntil: number;
  urgency: 'high' | 'medium' | 'low';
}

export function useVaccineReminders(profileId?: string) {
  return useQuery({
    queryKey: ["vaccine-reminders", profileId],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      let query = supabase
        .from("vaccination_records")
        .select("id, vaccine_name, dose_description, next_dose_date")
        .not("next_dose_date", "is", null)
        .gte("next_dose_date", now.toISOString().split('T')[0])
        .lte("next_dose_date", thirtyDaysFromNow.toISOString().split('T')[0])
        .order("next_dose_date", { ascending: true });

      if (profileId) {
        query = query.eq("profile_id", profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calcular dias até a próxima dose e nível de urgência
      const reminders: VaccineReminder[] = (data || []).map(vaccine => {
        const daysUntil = differenceInDays(parseISO(vaccine.next_dose_date), now);
        let urgency: 'high' | 'medium' | 'low' = 'low';

        if (daysUntil <= 7) {
          urgency = 'high';
        } else if (daysUntil <= 15) {
          urgency = 'medium';
        }

        return {
          ...vaccine,
          daysUntil,
          urgency
        };
      });

      return reminders;
    },
  });
}
