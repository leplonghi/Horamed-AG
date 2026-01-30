import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCollection, orderBy, where, limit } from "@/integrations/firebase";
import { Scale, Plus, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import VitalsRegistrationModal from "./VitalsRegistrationModal";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeightTrackingCardProps {
  userId: string;
  profileId?: string;
}

export default function WeightTrackingCard({ userId, profileId }: WeightTrackingCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const { data: latestLog, refetch } = useQuery({
    queryKey: ["latest-weight", userId, profileId],
    queryFn: async () => {
      // Use Firebase collection path
      const path = profileId ? `users/${userId}/profiles/${profileId}/weightLogs` : `users/${userId}/weightLogs`;
      const { data } = await fetchCollection<any>(path, [orderBy("recordedAt", "desc"), limit(1)]);
      return data && data.length > 0 ? data[0] : null;
    },
  });

  return (
    <>
      <Card className="border-2 hover:border-primary/30 transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            {language === 'pt' ? 'Controle de Peso' : 'Weight Tracking'}
          </CardTitle>
          <CardDescription>
            {language === 'pt' ? 'Mantenha seu peso atualizado para dosagens precisas.' : 'Keep your weight updated for accurate dosages.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{language === 'pt' ? 'Atual' : 'Current'}</p>
              {latestLog ? (
                <p className="text-3xl font-bold text-primary">
                  {latestLog.weightKg} <span className="text-lg font-normal">kg</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{language === 'pt' ? 'Não registrado' : 'Not registered'}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{language === 'pt' ? 'Última medição' : 'Last measurement'}</p>
              {latestLog ? (
                <p className="text-sm font-medium">
                  {format(new Date(latestLog.recordedAt), language === 'pt' ? "dd/MM/yyyy" : "MM/dd/yyyy", { locale: dateLocale })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">-</p>
              )}
            </div>
          </div>

          <Button
            className="w-full gap-2 h-12 text-base"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
            {language === 'pt' ? 'Registrar Novo Peso' : 'Log New Weight'}
          </Button>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {language === 'pt' ? 'Dica: A Clara usa seu peso para verificar a segurança das doses.' : 'Tip: Clara uses your weight to verify dose safety.'}
          </p>

          <Button
            variant="link"
            className="text-xs h-auto p-0 gap-1"
            onClick={() => navigate(`/sinais-vitais?tab=weight${profileId ? `&profile=${profileId}` : ""}`)}
          >
            <History className="h-3 w-3" />
            {language === 'pt' ? 'Ver histórico completo' : 'View full history'}
          </Button>
        </CardContent>
      </Card>

      <VitalsRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profileId={profileId}
        onSuccess={refetch}
        defaultTab="weight"
      />
    </>
  );
}
