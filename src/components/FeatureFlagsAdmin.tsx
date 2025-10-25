import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Info, Flag, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function FeatureFlagsAdmin() {
  const { flags, loading, refresh } = useFeatureFlags();

  const flagDescriptions: Record<string, string> = {
    badges: "Gamificação com badges Bronze/Prata/Ouro/Diamante",
    emergency: "Modo emergência guiada e ajuste de dose",
    prices: "Pesquisa de preços em farmácias",
    advancedDash: "Dashboards e gráficos avançados",
    interactions: "Análise de interações medicamentosas",
    aiStreaming: "Streaming token-by-token de IA",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>
              Status das funcionalidades do sistema
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Funcionalidades com 🔴 OFF estão desabilitadas por padrão no app.
            Para habilitá-las, acesse o Lovable Cloud (Backend).
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {Object.entries(flags).map(([key, enabled]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {key}
                  </code>
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? "🟢 ON" : "🔴 OFF"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {flagDescriptions[key] || "Sem descrição"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 <strong>Como habilitar:</strong></p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Acesse Lovable Cloud → Table Editor → feature_flags</li>
            <li>Encontre a flag desejada e edite a coluna "enabled"</li>
            <li>Altere para true e salve</li>
            <li>As mudanças são aplicadas instantaneamente</li>
          </ol>
          <p className="pt-2">📖 Veja <code>FEATURE_FLAGS.md</code> para mais detalhes</p>
        </div>
      </CardContent>
    </Card>
  );
}
