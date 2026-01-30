import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, Share2, Gift, Users, ArrowLeft, Target, Percent, Award, MessageCircle, Check, Ticket, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useReferralSystem } from "@/hooks/useReferralSystem";
import { useTranslation } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Recompensas() {
  const navigate = useNavigate();
  const { stats, loading, generateReferralLink, claimReward, isPremium } = useReferralSystem();
  const { t, language } = useTranslation();
  const [codeInput, setCodeInput] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyCode = () => {
    if (!stats.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode);
    setCodeCopied(true);
    toast.success(t('rewards.codeCopied'));
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const copyLink = () => {
    const link = generateReferralLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success(t('rewards.linkCopied'));
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const link = generateReferralLink();
    if (!link) {
      toast.error(t("toast.referral.linkError"));
      return;
    }
    const message = `🎁 Olá! Estou usando o HoraMed para gerenciar medicamentos e está sendo incrível!\n\nUse meu código *${stats.referralCode}* e ganhe 7 dias Premium grátis!\n\n👉 ${link}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareSMS = () => {
    const link = generateReferralLink();
    if (!link) return;
    const message = `🎁 Use meu código ${stats.referralCode} no HoraMed e ganhe 7 dias Premium grátis! ${link}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, "_blank");
  };

  const shareNative = async () => {
    const link = generateReferralLink();
    if (!link) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HoraMed - Convite',
          text: `🎁 Use meu código ${stats.referralCode} e ganhe 7 dias Premium grátis!`,
          url: link,
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const handleApplyCode = async () => {
    if (!codeInput.trim()) {
      toast.error(t("toast.referral.codeRequired"));
      return;
    }

    setApplyingCode(true);
    
    // O código será aplicado redirecionando para a página de auth com o parâmetro ref
    const authUrl = `/auth?ref=${encodeURIComponent(codeInput.trim().toUpperCase())}`;
    
    toast.info(t("toast.referral.createAccountInfo"));
    
    setTimeout(() => {
      setApplyingCode(false);
      navigate(authUrl);
    }, 1500);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('rewards.title')}</h1>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {t('rewards.headline')}
            </h2>
            <p className="text-muted-foreground">{t('rewards.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">
        {/* Tabs: Indicar ou Usar Código */}
        <Tabs defaultValue="indicar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="indicar" className="gap-2">
              <Gift className="h-4 w-4" />
              Indicar Amigos
            </TabsTrigger>
            <TabsTrigger value="codigo" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tenho um Código
            </TabsTrigger>
          </TabsList>

          {/* Tab: Indicar Amigos */}
          <TabsContent value="indicar" className="space-y-4">
            {/* Section 1: Your Code */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('rewards.yourCode')}</h3>
                  <div 
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 bg-background px-6 py-3 rounded-lg text-2xl font-mono font-bold border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    {stats.referralCode || t('common.loading')}
                    {codeCopied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Toque para copiar</p>
                </div>
              </div>
            </Card>

            {/* Section 2: Share Options */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Compartilhar
              </h3>
              <div className="space-y-3">
                {/* WhatsApp - Destaque */}
                <Button 
                  onClick={shareWhatsApp} 
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white gap-3"
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar pelo WhatsApp
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={shareSMS} variant="outline" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </Button>
                  <Button onClick={shareNative} variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Mais opções
                  </Button>
                </div>

                <Button 
                  onClick={copyLink} 
                  variant="secondary" 
                  className="w-full gap-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar link completo
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Como funciona */}
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">🎯 Como funciona</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p>Compartilhe seu código com amigos e familiares</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p>Eles criam uma conta usando seu código</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p><strong>Vocês dois</strong> ganham 7 dias Premium grátis!</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Usar Código */}
          <TabsContent value="codigo" className="space-y-4">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                    <Ticket className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Insira o código de indicação</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Recebeu um código de um amigo? Digite abaixo para ganhar 7 dias Premium grátis!
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Ex: HR-ABC123"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono h-12"
                    maxLength={10}
                  />
                  <Button 
                    onClick={handleApplyCode}
                    disabled={applyingCode || !codeInput.trim()}
                    className="w-full h-11"
                  >
                    {applyingCode ? "Aplicando..." : "Aplicar código"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  O código será aplicado ao criar uma nova conta ou fazer login
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
              <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">🎁 Benefícios</h3>
              <ul className="space-y-2 text-sm text-green-600 dark:text-green-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  7 dias de Premium grátis
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Medicamentos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Relatórios avançados
                </li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Section 3: Goals Progress */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4" /> {t('rewards.goalsProgress')}
          </h3>
          <div className="space-y-4">
            {/* Goal: 10 signups */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('rewards.goal10signups')}</span>
                <span className="font-bold">{stats.goals.signups_10.current}/{stats.goals.signups_10.target}</span>
              </div>
              <Progress value={(stats.goals.signups_10.current / stats.goals.signups_10.target) * 100} className="h-2" />
              {stats.goals.signups_10.completed && <span className="text-xs text-green-500">✓ {t('rewards.completed')}</span>}
            </div>

            {/* Goal: 5 monthly subs */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('rewards.goal5monthly')}</span>
                <span className="font-bold">{stats.goals.monthly_subs_5.current}/{stats.goals.monthly_subs_5.target}</span>
              </div>
              <Progress value={(stats.goals.monthly_subs_5.current / stats.goals.monthly_subs_5.target) * 100} className="h-2" />
              {stats.goals.monthly_subs_5.completed && <span className="text-xs text-green-500">✓ {t('rewards.completed')}</span>}
            </div>

            {/* Goal: 3 annual subs */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('rewards.goal3annual')}</span>
                <span className="font-bold">{stats.goals.annual_subs_3.current}/{stats.goals.annual_subs_3.target}</span>
              </div>
              <Progress value={(stats.goals.annual_subs_3.current / stats.goals.annual_subs_3.target) * 100} className="h-2" />
              {stats.goals.annual_subs_3.completed && <span className="text-xs text-green-500">✓ {t('rewards.completed')}</span>}
            </div>
          </div>
        </Card>

        {/* Section 4: Premium Discount */}
        {isPremium && (
          <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Percent className="h-4 w-4 text-yellow-500" /> {t('rewards.premiumDiscount')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>{t('rewards.accumulatedDiscount')}</span>
                <span className="text-2xl font-bold text-yellow-500">{stats.discountPercent}%</span>
              </div>
              <Progress value={stats.discountPercent} max={90} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {t('rewards.limitInfo')} • {stats.cyclesRemaining} {t('rewards.cyclesRemaining')}
              </p>
            </div>
          </Card>
        )}

        {/* Section 5: Available Benefits */}
        {stats.availableRewards.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" /> {t('rewards.availableBenefits')}
            </h3>
            <div className="space-y-2">
              {stats.availableRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{reward.type.replace(/_/g, ' ')}</span>
                    {reward.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        {t('rewards.expires')}: {formatDate(reward.expiresAt)}
                      </p>
                    )}
                  </div>
                  {reward.status === 'granted' && (
                    <Button size="sm" onClick={() => claimReward(reward.id)}>
                      {t('rewards.use')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Referrals List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> {t('rewards.yourReferrals')} ({stats.totalReferrals})
          </h3>
          {stats.recentReferrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              {t('rewards.noReferrals')}
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentReferrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm">#{ref.id.slice(0, 8)}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ref.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ref.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    ref.status === 'signup_completed' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {ref.status === 'active' ? t('rewards.statusActive') : 
                     ref.status === 'signup_completed' ? t('rewards.statusSignup') : 
                     t('rewards.statusPending')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Final CTA */}
        <div className="flex gap-2 pt-4">
          <Button onClick={shareWhatsApp} className="flex-1 bg-gradient-to-r from-primary to-purple-500 gap-2">
            <MessageCircle className="h-4 w-4" />
            {t('rewards.inviteNow')}
          </Button>
          <Button onClick={() => navigate("/planos")} variant="outline" className="flex-1">
            {t('rewards.viewPlans')}
          </Button>
        </div>
      </div>
    </div>
  );
}
