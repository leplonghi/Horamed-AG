import { Plus, Package, Edit, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyStatePro } from "@/components/ui/EmptyStatePro";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StockTimeline } from "@/components/StockTimeline";
import { StockOriginBadge } from "@/components/StockOriginBadge";
import { StockConsumptionChart } from "@/components/StockConsumptionChart";
import HelpTooltip from "@/components/HelpTooltip";
import TutorialHint from "@/components/TutorialHint";
import { useTranslation } from "@/contexts/LanguageContext";
import { useState } from "react";
import { StockProjection } from "@/hooks/useStockProjection";

interface StockTabProps {
    stockProjections: StockProjection[] | undefined;
    isLoading: boolean;
    onRestock: (itemId: string, itemName: string) => Promise<void>;
    onUpdateStock: (stockId: string, newUnitsLeft: number) => Promise<void>;
    onNavigateToRoutine: () => void;
    affiliateEnabled: boolean;
}

export function StockTab({
    stockProjections,
    isLoading,
    onRestock,
    onUpdateStock,
    onNavigateToRoutine,
    affiliateEnabled
}: StockTabProps) {
    const { t } = useTranslation();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

    const toggleExpanded = (id: string) => {
        const newSet = new Set(expandedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedItems(newSet);
    };

    const getStockStatus = (unitsLeft: number, unitsTotal: number) => {
        const percentage = (unitsLeft / unitsTotal) * 100;
        if (percentage <= 10) return { color: "text-destructive", bg: "bg-destructive/10", label: t('meds.critical') };
        if (percentage <= 20) return { color: "text-warning", bg: "bg-warning/10", label: t('meds.low') };
        if (percentage <= 50) return { color: "text-primary", bg: "bg-primary/10", label: t('meds.medium') };
        return { color: "text-success", bg: "bg-success/10", label: t('meds.good') };
    };

    return (
        <div className="space-y-6 mt-6">
            <TutorialHint
                id={t('tutorials.estoque.id')}
                title={t('tutorials.estoque.title')}
                message={t('tutorials.estoque.message')}
            />

            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{t('stock.howItWorks')}</p>
                                <HelpTooltip content={t('tutorials.estoque.message')} iconSize="sm" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('stock.howItWorksDesc') }} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="animate-pulse text-center text-muted-foreground py-8">{t('stock.loading')}</div>
            ) : (!stockProjections || stockProjections.length === 0) ? (
                <EmptyStatePro
                    title={t('stock.noStockConfigured')}
                    description={t('stock.noStockDesc')}
                    icon={Package}
                    actionLabel={t('meds.addMedication')}
                    onAction={onNavigateToRoutine}
                />
            ) : (
                <div className="space-y-4">
                    {stockProjections?.map((item) => {
                        const percentage = (item.currentQty / item.unitsTotal) * 100;
                        const status = getStockStatus(item.currentQty, item.unitsTotal);
                        const isExpanded = expandedItems.has(item.id);

                        return (
                            <Card key={item.id} className={`transition-all hover:shadow-md ${status.bg}`}>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <h3 className="font-semibold text-lg">{item.itemName}</h3>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-muted-foreground">
                                                    <strong className={status.color}>
                                                        {item.currentQty}
                                                    </strong>{" "}
                                                    de {item.unitsTotal} unidades
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <StockOriginBadge
                                                prescriptionId={item.createdFromPrescriptionId}
                                                prescriptionTitle={item.prescriptionTitle}
                                                lastRefillAt={item.lastRefillAt}
                                            />
                                        </div>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setEditingItem(item.id);
                                                    setAdjustmentAmount(0);
                                                }}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Ajustar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Ajustar Estoque</DialogTitle>
                                                    <DialogDescription>
                                                        {item.itemName} - Adicione ou remova unidades
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Estoque Atual</Label>
                                                        <div className="text-3xl font-bold text-primary">
                                                            {item.currentQty} unidades
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="adjustment">Quantidade para ajustar</Label>
                                                        <Input
                                                            id="adjustment"
                                                            type="number"
                                                            min="1"
                                                            placeholder={t("placeholder.quantity")}
                                                            value={adjustmentAmount || ""}
                                                            onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button
                                                            onClick={() => {
                                                                onUpdateStock(item.id, item.currentQty + adjustmentAmount);
                                                                // Close dialog logic needs to be handled by parent or controlled dialog
                                                            }}
                                                            disabled={adjustmentAmount <= 0}
                                                            className="w-full"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Reabastecer
                                                        </Button>
                                                        <Button
                                                            onClick={() => onUpdateStock(item.id, Math.max(0, item.currentQty - adjustmentAmount))}
                                                            disabled={adjustmentAmount <= 0}
                                                            variant="outline"
                                                            className="w-full"
                                                        >
                                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                                            Remover
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="space-y-2">
                                        <Progress value={percentage} className="h-3" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{Math.round(percentage)}% disponível</span>
                                            {item.daysRemaining !== null && item.daysRemaining > 0 && (
                                                <span className={`${item.daysRemaining <= 7 ? "text-destructive font-medium" :
                                                    item.daysRemaining <= 14 ? "text-warning font-medium" : ""
                                                    }`}>
                                                    ~{item.daysRemaining} dias restantes
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {percentage <= 20 && (
                                        <div className={`flex items-start gap-2 p-3 rounded-lg ${percentage <= 10 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
                                            }`}>
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm flex-1">
                                                <strong>{percentage <= 10 ? "🚨 Estoque Crítico!" : "⚠️ Estoque Baixo"}</strong>
                                                <p>{percentage <= 10 ? `Apenas ${item.currentQty} unidades restantes.` : `Considere repor em breve.`}</p>
                                            </div>
                                            {affiliateEnabled && percentage <= 10 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onRestock(item.itemId, item.itemName)}
                                                    className="shrink-0"
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Comprar
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
                                        <CollapsibleTrigger className="w-full">
                                            <Button variant="ghost" size="sm" className="w-full">
                                                {isExpanded ? '▼' : '▶'} Ver detalhes
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-4 pt-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <StockConsumptionChart
                                                    itemName={item.itemName}
                                                    takenCount={item.takenCount7d}
                                                    scheduledCount={item.scheduledCount7d}
                                                    adherence={item.adherence7d}
                                                    trend={item.consumptionTrend}
                                                    unitsLeft={item.currentQty}
                                                    unitsTotal={item.unitsTotal}
                                                />
                                                <StockTimeline
                                                    itemName={item.itemName}
                                                    consumptionHistory={item.consumptionHistory}
                                                    dailyAvg={item.dailyConsumptionAvg}
                                                    daysRemaining={item.daysRemaining}
                                                />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
