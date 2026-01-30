import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { auth, fetchDocument } from "@/integrations/firebase";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { StockTimeline } from "@/components/StockTimeline";
import { useStockProjection } from "@/hooks/useStockProjection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StockDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: item } = useQuery({
    queryKey: ["item-stock-details", itemId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user || !itemId) return null;
      const { data } = await fetchDocument<any>(`users/${user.uid}/medications`, itemId);
      return data;
    },
    enabled: !!itemId,
  });

  // Fetch all projections (undefined profileId) or filter if we had profileId
  // Passing undefined fetches all, then we find by itemId
  const { data: stockProjections = [] } = useStockProjection(item?.profileId);
  const stockProjection = stockProjections.find(sp => sp.itemId === itemId);

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
          {t('generic.back')}
        </Button>

        <PageHeader
          title={t('stockDetails.title')}
          description={item?.name || t('common.loading')}
          icon={<Package className="h-6 w-6 text-primary" />}
        />

        <div className="space-y-6 mt-6">
          {stockProjection && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('stockDetails.overview')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('stockDetails.currentQty')}</p>
                        <p className="text-2xl font-bold">{stockProjection.currentQty} {stockProjection.unitLabel || t('generic.units')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('stockDetails.daysRemaining')}</p>
                        <p className="text-2xl font-bold">{stockProjection.daysRemaining !== null ? stockProjection.daysRemaining : "N/A"} {t('generic.days')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('stockDetails.consumptionHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockTimeline
                    itemName={stockProjection.itemName}
                    consumptionHistory={stockProjection.consumptionHistory || []}
                    dailyAvg={stockProjection.dailyConsumptionAvg || 0}
                    daysRemaining={stockProjection.daysRemaining || null}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}