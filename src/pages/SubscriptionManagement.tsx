import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { CheckCircle as CheckCircle2, Crown, CalendarBlank as Calendar, CreditCard, ArrowLeft, WarningCircle as AlertCircle, Sparkle as Sparkles, XCircle, Warning as AlertTriangle, Heart, TrendDown as TrendingDown, Shield, Gift } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { PRICING } from "@/lib/stripeConfig";
import { Spinner as Loader2 } from "@phosphor-icons/react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PaymentMethodModal } from "@/components/PaymentMethodModal";
import { useTranslation } from "@/contexts/LanguageContext";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

export default function SubscriptionManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, isPremium, isFree, isExpired, daysLeft, loading, refresh, isOnTrial } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelStep, setCancelStep] = useState<'confirm' | 'fomo' | 'final'>('confirm');
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  // Calculate if within 7-day free cancellation window
  const daysSubscribed = subscription?.startedAt
    ? differenceInDays(new Date(), safeDateParse(subscription.startedAt))
    : 0;
  const isWithinFreeCancellation = daysSubscribed <= 7;

  // Check for payment update success
  useEffect(() => {
    if (searchParams.get('payment_updated') === 'true') {
      toast.success(t("toast.subscription.paymentUpdated"));
      // Remove the query param
      window.history.replaceState({}, '', '/assinatura');
    }
  }, [searchParams, t]);

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handleCancelClick = () => {
    setCancelStep('confirm');
    setShowCancelDialog(true);
  };

  const handleCancelProceed = () => {
    if (cancelStep === 'confirm') {
      setCancelStep('fomo');
    } else if (cancelStep === 'fomo') {
      setCancelStep('final');
    }
  };

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      const { functions } = await import("@/integrations/firebase/client");
      const { httpsCallable } = await import("firebase/functions");

      const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
      const result = await cancelSubscription({ immediate: isWithinFreeCancellation });
      const data = result.data as { success?: boolean; error?: string };

      if (data?.success) {
        if (isWithinFreeCancellation) {
          toast.success(t("toast.subscription.canceledNoCharge"));
        } else {
          toast.success(t("toast.subscription.canceledEndPeriod"));
        }

        setShowCancelDialog(false);
        refresh();
      } else {
        throw new Error(data?.error || "Erro ao cancelar");
      }
    } catch (error: unknown) {
      console.error('Cancel error:', error);
      toast.error(t("toast.subscription.cancelError"));
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleApplyOffer = async () => {
    setCancelingSubscription(true);
    try {
      const { functions } = await import("@/integrations/firebase/client");
      const { httpsCallable } = await import("firebase/functions");

      const applyRetentionOffer = httpsCallable(functions, 'applyRetentionOffer');
      await applyRetentionOffer();
      toast.success("Desconto aplicado com sucesso!");
      setShowCancelDialog(false);
      refresh();
    } catch (error: unknown) {
      console.error('Offer error:', error);
      toast.error("Erro ao aplicar desconto.");
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleReactivate = () => {
    navigate("/planos");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Gerenciar Assinatura</h1>
        </div>

        {/* Current Plan Card */}
        <Card className={`p-6 ${isPremium ? 'border-2 border-primary' : ''}`}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${isPremium ? 'bg-primary' : 'bg-muted'} flex items-center justify-center`}>
                  {isPremium ? (
                    <Crown className="h-6 w-6 text-white" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Plano {isPremium ? 'Premium' : 'Gratuito'}
                  </h2>
                  <Badge
                    variant={isPremium ? 'default' : isExpired ? 'destructive' : 'secondary'}
                    className="mt-1"
                  >
                    {subscription?.status === 'active' ? 'Ativo' :
                      subscription?.status === 'cancelled' ? 'Cancelado' :
                        subscription?.status === 'expired' ? 'Expirado' :
                          (subscription?.status === 'trialing' || isOnTrial) ? 'Teste Gratuito' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="space-y-3 pt-4 border-t">
              {subscription?.startedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Início
                  </span>
                  <span className="font-medium">
                    {format(safeDateParse(subscription.startedAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {subscription?.expiresAt && !isPremium && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expira em
                  </span>
                  <span className="font-medium">
                    {format(safeDateParse(subscription.expiresAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({daysLeft} dias)
                      </span>
                    )}
                  </span>
                </div>
              )}


              {isPremium && (
                <div className="flex flex-col gap-2 border-t pt-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {isOnTrial ? 'Fim do Teste' : 'Próxima Cobrança'}
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      {subscription?.expiresAt
                        ? format(safeDateParse(subscription.expiresAt), "dd 'de' MMMM, yyyy", { locale: ptBR })
                        : 'Recorrente'}
                      {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
                        <span className={`text-xs ml-1 ${daysLeft <= 3 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                          ({daysLeft} dias)
                        </span>
                      )}
                    </span>
                  </div>
                  {isOnTrial && (
                    <div className="text-xs text-muted-foreground bg-primary/10 p-2 rounded text-center">
                      Você não será cobrado se cancelar antes desta data.
                    </div>
                  )}
                </div>
              )}

              {/* Discount Display */}
              {subscription?.discountApplied && (
                <div className="flex items-center justify-between text-sm bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                  <span className="text-muted-foreground flex items-center gap-2 text-green-700">
                    <Gift className="h-4 w-4" />
                    Desconto Ativo
                  </span>
                  <span className="font-bold text-green-700">
                    {subscription.discountPercent}% OFF
                  </span>
                </div>
              )}

              {/* Explicit Renewal Price */}
              {/* Explicit Renewal Price */}
              {(subscription?.amount || isPremium) && (
                <div className="flex items-center justify-between text-sm border-t pt-2 mt-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Valor
                  </span>

                  {(() => {
                    // Determine base amount (use subscription amount or fallback defaults)
                    const isYearly = subscription?.interval === 'year';
                    const isBrl = subscription?.currency !== 'usd'; // Default to BRL
                    const currencySymbol = isBrl ? 'R$' : '$';

                    // Fallback prices from index.ts
                    const defaultAmount = isBrl
                      ? (isYearly ? 19990 : 1990)
                      : (isYearly ? 3999 : 399);

                    const baseAmount = subscription?.amount || defaultAmount;
                    const discountPercent = subscription?.discountPercent || 0;
                    const finalAmount = baseAmount * (1 - discountPercent / 100);

                    return (
                      <div className="text-right">
                        {discountPercent > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground line-through">
                              {currencySymbol} {(baseAmount / 100).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="font-bold text-green-600">
                              {currencySymbol} {(finalAmount / 100).toFixed(2).replace('.', ',')}
                              <span className="text-xs text-muted-foreground font-normal ml-1 text-green-600/80">
                                /{isYearly ? 'ano' : 'mês'}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {currencySymbol} {(baseAmount / 100).toFixed(2).replace('.', ',')}
                            <span className="text-muted-foreground font-normal ml-1">
                              /{isYearly ? 'ano' : 'mês'}
                            </span>
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-sm text-muted-foreground">Recursos inclusos:</h3>
              <div className="space-y-2">
                {isPremium ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Medicamentos ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>OCR de receitas médicas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Assistente de saúde com IA</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Relatórios mensais</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Sem anúncios</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>1 medicamento</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Recursos limitados</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {isPremium ? (
            <>
              <Button
                variant="default"
                className="w-full"
                onClick={handleOpenPaymentModal}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Alterar Forma de Pagamento
              </Button>

              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleCancelClick}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Assinatura
              </Button>

              {isWithinFreeCancellation && (
                <p className="text-xs text-center text-muted-foreground">
                  Você está dentro do período de 7 dias. Cancele sem custos.
                </p>
              )}
            </>
          ) : (
            <>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleReactivate}
              >
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade para Premium
              </Button>
              {isExpired && (
                <Card className="p-4 bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive">
                    Seu período de teste expirou. Faça upgrade para continuar usando todos os recursos.
                  </p>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Support Info */}
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Precisa de ajuda?</span> Entre em contato conosco através da seção "Ajuda e suporte" no perfil.
          </p>
        </Card>
      </div>

      {/* Cancel Dialog with FOMO */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-md">
          {cancelStep === 'confirm' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Tem certeza que quer cancelar?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    {isWithinFreeCancellation
                      ? "Você está dentro do período de 7 dias. Seu cancelamento será imediato e você não será cobrado."
                      : "Sua assinatura continuará ativa até o final do período pago. Após isso, você perderá acesso aos recursos Premium."}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.back')}</AlertDialogCancel>
                <Button variant="destructive" onClick={handleCancelProceed}>
                  Continuar cancelamento
                </Button>
              </AlertDialogFooter>
            </>
          )}

          {cancelStep === 'fomo' && (
            <div className="space-y-6 pt-4 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Gift className="h-16 w-16 text-primary relative z-10 mx-auto" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                  Espere um pouco!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Valorizamos muito você como membro Premium. Que tal continuar conosco com um desconto especial de retenção?
                </p>

                {(() => {
                  const isAnnual = subscription?.interval === 'year';
                  const isUSD = subscription?.currency === 'usd';
                  const config = isUSD ? PRICING.usd : PRICING.brl;
                  const originalPrice = isAnnual ? config.annual : config.monthly;
                  const period = isAnnual ? (isUSD ? 'year' : 'ano') : (isUSD ? 'mo' : 'mês');
                  const symbol = config.symbol;
                  const discountedPrice = originalPrice * 0.85;

                  return (
                    <div className="py-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                      <div className="text-sm text-muted-foreground mb-1">
                        O valor da sua assinatura cairá para:
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-muted-foreground line-through text-lg decoration-red-500/50">
                          {symbol} {originalPrice.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-3xl font-bold text-primary">
                          {symbol} {discountedPrice.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                        /{period} • Válido por 12 meses
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-primary to-teal-600 hover:opacity-90 transition-opacity h-12 text-lg"
                  onClick={handleApplyOffer}
                  disabled={cancelingSubscription}
                >
                  {cancelingSubscription ? <Loader2 className="animate-spin" /> : "Resgatar 15% de Desconto"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive text-xs"
                  onClick={handleCancelProceed}
                  disabled={cancelingSubscription}
                >
                  Não quero desconto, cancelar
                </Button>
              </div>
            </div>
          )}

          {cancelStep === 'final' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Confirmar Cancelamento
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isWithinFreeCancellation ? (
                    <p>
                      Sua assinatura será <strong>cancelada imediatamente</strong> e você não será cobrado.
                    </p>
                  ) : (
                    <p>
                      Sua assinatura permanecerá ativa até <strong>
                        {subscription?.expiresAt
                          ? format(safeDateParse(subscription.expiresAt), "dd 'de' MMMM", { locale: ptBR })
                          : 'o final do período'}
                      </strong>. Após essa data, você será rebaixado para o plano gratuito.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelingSubscription}>
                  Voltar
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                >
                  {cancelingSubscription ? "Cancelando..." : "Confirmar Cancelamento"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={refresh}
      />
    </div>
  );
}
