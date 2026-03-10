import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Warning as AlertTriangle, TrendUp as TrendingUp, Shield, X, ArrowsClockwise as RefreshCw, Sparkle as Sparkles, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { useAuth, fetchCollection, updateDocument, orderBy, limit, where } from '@/integrations/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

interface Insight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  severity: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export default function HealthInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { isEnabled } = useFeatureFlags();
  const navigate = useNavigate();

  // Feature flag: interactions desabilitada por padrão
  const interactionsEnabled = isEnabled('interactions');

  const loadInsights = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await fetchCollection<Insight>(
        `users/${user.uid}/healthInsights`,
        [
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(5)
        ]
      );

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isPremium && user) {
      loadInsights();
    }
  }, [isPremium, user, loadInsights]);

  const runAnalysis = async () => {
    if (!isPremium) {
      navigate('/planos');
      return;
    }

    setAnalyzing(true);
    toast.loading('Analisando seus medicamentos...');

    try {
      let interactionData: { insights?: unknown[]; total?: number } | null = null;
      let predictiveData: { insights?: unknown[]; total?: number } | null = null;

      // Análise de interações medicamentosas (apenas se flag habilitada)
      if (interactionsEnabled) {
        const analyzeDrugInteractions = httpsCallable<unknown, { insights: unknown[]; total: number }>(functions, 'analyzeDrugInteractions');
        const result = await analyzeDrugInteractions();
        interactionData = result.data;
      }

      // Análise preditiva de saúde
      const predictiveHealthAnalysis = httpsCallable<unknown, { insights: unknown[]; total: number }>(functions, 'predictiveHealthAnalysis');
      const result = await predictiveHealthAnalysis();
      predictiveData = result.data;

      toast.dismiss();

      if ((interactionData?.insights?.length ?? 0) > 0 || (predictiveData?.insights?.length ?? 0) > 0) {
        const interactionCount = interactionData?.total || 0;
        const predictiveCount = predictiveData?.total || 0;
        toast.success('Análise concluída! Novos insights detectados', {
          description: interactionsEnabled
            ? `${interactionCount} interações + ${predictiveCount} padrões`
            : `${predictiveCount} padrões detectados`
        });
        await loadInsights();
      } else {
        toast.success('Tudo certo! Nenhum problema detectado');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error running analysis:', error);
      toast.error('Erro ao executar análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDocument(
        `users/${user.uid}/healthInsights`,
        id,
        { isRead: true }
      );

      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500">Atenção</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (!isPremium) {
    return (
      <Card className="relative overflow-hidden p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm animate-pulse">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">
                🛡️ Proteção Inteligente
              </h3>
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Análise avançada de interações medicamentosas com IA. Detecte riscos invisíveis e proteja sua saúde com tecnologia de ponta.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Detecção de interações</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Análise preditiva</span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/planos')}
              className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Ativar Proteção Premium
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Proteção Inteligente
            </h2>
            <p className="text-xs text-muted-foreground">
              Sistema ativo de monitoramento
            </p>
          </div>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={analyzing}
          size="sm"
          variant="outline"
          className="gap-2 hover:bg-primary/5 transition-all hover:scale-105"
        >
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analisando...' : 'Nova Análise'}
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card className="relative overflow-hidden p-8 text-center bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-dashed animate-fade-in">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative space-y-3">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Sistema Ativo e Protegendo
              </p>
              <p className="text-sm text-muted-foreground">
                Nenhuma interação perigosa detectada
              </p>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 inline-block px-3 py-1 rounded-full">
              💡 Execute análises regulares para máxima segurança
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Card
              key={insight.id}
              style={{
                animationDelay: `${index * 100}ms`,
                borderLeftColor: insight.severity === 'critical' ? 'hsl(var(--destructive))' :
                  insight.severity === 'warning' ? 'hsl(var(--warning))' :
                    'hsl(var(--primary))'
              }}
              className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-scale-in border-l-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-muted to-muted/50">
                  {getSeverityIcon(insight.severity)}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(insight.severity)}
                    <span className="text-xs text-muted-foreground">
                      {safeDateParse(insight.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-foreground leading-tight">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.metadata?.recommendation && (
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Sparkles className="h-3 w-3" />
                        <span>Recomendação Personalizada</span>
                      </div>
                      <p className="text-sm text-foreground/80">
                        {typeof insight.metadata?.recommendation === 'string' ? insight.metadata.recommendation : ''}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => markAsRead(insight.id)}
                  className="text-muted-foreground hover:text-foreground transition-all hover:scale-110 p-2 rounded-lg hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}