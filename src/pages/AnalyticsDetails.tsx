import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { auth, fetchCollection, where, orderBy } from "@/integrations/firebase";
import { startOfDay, endOfDay, subDays } from "date-fns";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import AdherenceChart from "@/components/AdherenceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InteractiveTimelineChart from "@/components/InteractiveTimelineChart";

export default function AnalyticsDetails() {
  const navigate = useNavigate();

  const { data: doses = [] } = useQuery({
    queryKey: ["analytics-doses"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];

      const now = new Date();
      const startDate = subDays(now, 30);

      // Fetch Doses
      const { data: dosesData } = await fetchCollection<any>(`users/${user.uid}/doses`, [
        where('dueAt', '>=', startOfDay(startDate).toISOString()),
        where('dueAt', '<=', endOfDay(now).toISOString()),
        orderBy('dueAt', 'asc')
      ]);

      // Fetch Items for names
      const { data: itemsData } = await fetchCollection<any>(`users/${user.uid}/medications`);
      const itemsMap = new Map(itemsData?.map(item => [item.id, item]));

      // Transform to match expected type
      const transformedData = (dosesData || []).map(dose => {
        const item = itemsMap.get(dose.itemId);
        return {
          id: dose.id,
          itemId: dose.itemId, // Pass this just in case
          dueAt: dose.dueAt,
          status: dose.status as 'scheduled' | 'taken' | 'missed' | 'skipped',
          takenAt: dose.takenAt,
          items: {
            name: item?.name || 'Medicamento'
          }
        };
      });

      return transformedData;
    },
    // In React Query v5, 'enabled' depends on auth state which might be async. 
    // Usually handled by parent or queryClient defaults, but explicitly checking user in fn is safe.
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <PageHeader
          title="Análise Detalhada de Progresso"
          description="Veja estatísticas completas de adesão e pontualidade"
          icon={<BarChart3 className="h-6 w-6 text-primary" />}
        />

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Adesão</CardTitle>
            </CardHeader>
            <CardContent>
              <AdherenceChart period="month" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveTimelineChart doses={doses} period="month" />
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
