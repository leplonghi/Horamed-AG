import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAdSupport } from "@/hooks/useAdSupport";
import { useSubscription } from "@/hooks/useSubscription";
import { getRewardedPlacementId, isNativeAdPlatform } from "@/lib/adsConfig";
import { showRewardedAd } from "@/lib/nativeAdMob";
import { Crown, Timer, MegaphoneSimple } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { safeDateParse } from "@/lib/safeDateUtils";

interface AdSupportCardProps {
  className?: string;
}

export default function AdSupportCard({ className = "" }: AdSupportCardProps) {
  const navigate = useNavigate();
  const { isPremium, isOnTrial } = useSubscription();
  const [loadingReward, setLoadingReward] = useState(false);
  const {
    adFreeHours,
    adFreeUntilDate,
    canClaimDailyPause,
    hasAdFreeAccess,
    isTemporarilyAdFree,
    nextClaimDate,
    activateDailyPause,
  } = useAdSupport();

  if (isPremium || isOnTrial) return null;

  const handlePauseAds = async () => {
    if (!canClaimDailyPause) return;

    if (isNativeAdPlatform()) {
      setLoadingReward(true);
      try {
        const reward = await showRewardedAd(getRewardedPlacementId());
        if (!reward) {
          toast.error("Nao foi possivel carregar o anuncio recompensado agora.");
          return;
        }
      } catch (error) {
        console.error("Rewarded ad error:", error);
        toast.error("Nao foi possivel exibir o anuncio agora. Tente novamente em instantes.");
        return;
      } finally {
        setLoadingReward(false);
      }
    }

    const nextState = activateDailyPause();
    const endsAt = safeDateParse(nextState.adFreeUntil).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    toast.success(`Anuncios pausados ate ${endsAt}.`);
  };

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 via-background to-teal-500/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-primary/10 p-2.5 text-primary">
          <MegaphoneSimple className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">
                Plano gratis apoiado por anuncios discretos
              </h3>
              {hasAdFreeAccess && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                  sem anuncios
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Mantemos o lembrete, a carteira e a rotina acessiveis no free sem colocar anuncio no meio dos fluxos criticos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/planos")} className="gap-2">
              <Crown className="h-4 w-4" />
              Ir para Premium
            </Button>

            {canClaimDailyPause ? (
              <Button size="sm" onClick={() => void handlePauseAds()} className="gap-2" disabled={loadingReward}>
                <Timer className="h-4 w-4" />
                {isNativeAdPlatform()
                  ? loadingReward
                    ? "Carregando anuncio..."
                    : `Assistir anuncio e pausar por ${adFreeHours}h`
                  : `Pausar anuncios por ${adFreeHours}h`}
              </Button>
            ) : (
              <div className="flex items-center rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                {isTemporarilyAdFree && adFreeUntilDate
                  ? `Sem anuncios ate ${adFreeUntilDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : nextClaimDate
                    ? `Nova pausa disponivel apos ${nextClaimDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                    : "Pausa diaria indisponivel agora"}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
