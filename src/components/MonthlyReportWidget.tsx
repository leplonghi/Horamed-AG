import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CaretRight as ChevronRight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { auth, fetchCollection, where } from "@/integrations/firebase";

function MonthlyReportWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const locale = language === 'pt' ? ptBR : enUS;
  const lastMonth = subMonths(new Date(), 1);
  const monthName = format(lastMonth, 'MMMM', { locale });

  const { data: hasEnoughData = false } = useQuery({
    queryKey: ["monthly-report-eligibility"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return false;

      const monthStart = startOfMonth(lastMonth);
      const monthEnd = endOfMonth(lastMonth);

      // Fetch doses in range
      // Optimization: We could use count() if supported, but filtered fetch + length check for small range is okay for client side logic if dataset isn't huge.
      // Or limit to 7 items to minimize read cost if we only care if it's >= 7.

      const { data } = await fetchCollection<any>(
        "dose_instances",
        [where("userId", "==", user.uid), 
          where('dueAt', '>=', monthStart.toISOString()),
          where('dueAt', '<=', monthEnd.toISOString())
        ]
      );

      return (data?.length || 0) >= 7;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!hasEnoughData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-4">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">
                {language === 'pt'
                  ? `ðŸ“Š RelatÃ³rio de ${monthName}`
                  : `ðŸ“Š ${monthName} Report`}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'pt'
                  ? 'Pronto para consulta mÃ©dica'
                  : 'Ready for your doctor'}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/relatorios')}
              className="shrink-0 text-xs h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
            >
              {language === 'pt' ? 'Ver' : 'View'}
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default memo(MonthlyReportWidget);
