import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { differenceInDays } from "date-fns";
import InfoDialog from "./InfoDialog";
import { useStockProjection } from "@/hooks/useStockProjection";
import { useUserProfiles } from "@/hooks/useUserProfiles";

export default function StockChart() {
  const { activeProfile } = useUserProfiles();
  // Fetch stock projections for the active profile (or all if activeProfile is null/undefined logic handled in hook?)
  // The hook filters by profileId if provided. If we want all, we pass undefined.
  // Usually charts show data for the active profile.
  const { data: stockItems = [], isLoading: loading } = useStockProjection(activeProfile?.id);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse text-muted-foreground text-center">
          Carregando estoque...
        </div>
      </Card>
    );
  }

  if (stockItems.length === 0) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Controle de Estoque
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure o estoque dos seus medicamentos para receber alertas quando estiver acabando.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = stockItems.map(item => ({
    name: item.itemName.length > 15 ? item.itemName.substring(0, 15) + "..." : item.itemName,
    fullName: item.itemName,
    restante: item.currentQty,
    total: item.unitsTotal,
    percentage: item.unitsTotal > 0 ? (item.currentQty / item.unitsTotal) * 100 : 0,
    unit_label: item.unitLabel || "un", // StockProjection updated to include unitLabel
    days_remaining: item.daysRemaining,
  }));

  // Calculate alerts
  const lowStock = stockItems.filter(item => {
    const percentage = item.unitsTotal > 0 ? (item.currentQty / item.unitsTotal) * 100 : 0;
    return percentage < 20 && percentage > 0;
  });

  const criticalStock = stockItems.filter(item => {
    return item.daysRemaining !== null && item.daysRemaining <= 7 && item.daysRemaining > 0;
  });

  const getBarColor = (percentage: number) => {
    if (percentage > 50) return "hsl(var(--success))";
    if (percentage > 20) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Controle de Estoque
              </h3>
              <InfoDialog
                title="Controle de estoque"
                description="Acompanhe a quantidade disponível de cada medicamento. O sistema calcula automaticamente quando vai acabar e envia alertas para você não ficar sem remédio."
                triggerClassName="h-5 w-5"
              />
            </div>
            {(lowStock.length > 0 || criticalStock.length > 0) && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium text-warning">
                  {lowStock.length + criticalStock.length} alerta(s)
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Acompanhe a quantidade disponível de cada medicamento e planeje suas reposições
          </p>

          {/* Stock Bar Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Unidades', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    if (name === "restante") {
                      return [
                        `${value} de ${props.payload.total} ${props.payload.unit_label}`,
                        props.payload.fullName
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="restante" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Stock Details Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {stockItems.map((item) => {
          const percentage = item.unitsTotal > 0 ? (item.currentQty / item.unitsTotal) * 100 : 0;
          const daysLeft = item.daysRemaining;

          const isLowStock = percentage < 20 && percentage > 0;
          const isCritical = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

          return (
            <Card
              key={item.itemId}
              className={`p-4 transition-all ${isCritical ? 'bg-destructive/5 border-destructive/30' :
                  isLowStock ? 'bg-warning/5 border-warning/30' :
                    'hover:shadow-md'
                }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-semibold text-base">{item.itemName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.currentQty} de {item.unitsTotal} {item.unitLabel || "un"}
                    </p>
                  </div>
                  {(isLowStock || isCritical) && (
                    <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${isCritical ? 'text-destructive' : 'text-warning'
                      }`} />
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getBarColor(percentage)
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(percentage)}% disponível</span>
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className={
                        daysLeft <= 7 ? 'text-destructive font-medium' :
                          daysLeft <= 14 ? 'text-warning font-medium' :
                            'text-muted-foreground'
                      }>
                        ~{daysLeft} dias restantes
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert Messages */}
                {isCritical && (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>Estoque acabando! Acaba em {daysLeft} dias.</span>
                  </div>
                )}
                {isLowStock && !isCritical && (
                  <div className="flex items-start gap-2 p-2 bg-warning/10 rounded text-xs text-warning-foreground">
                    <TrendingDown className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>Estoque baixo. Considere repor em breve.</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como funciona o estoque?</p>
            <p>
              O sistema calcula automaticamente quando seu estoque vai acabar com base no consumo diário.
              Você receberá alertas quando estiver baixo ou próximo do fim.
            </p>
            <p className="text-xs mt-2">
              💡 <strong>Dica:</strong> Mantenha sempre estoque extra de medicamentos essenciais para evitar interrupções no tratamento.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
