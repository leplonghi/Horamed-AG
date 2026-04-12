import {
    IconPlus as Plus,
    IconArchive as Package,
    IconPencil as Edit,
    IconAlertTriangle as AlertTriangle,
    IconArrowRight as ExternalLink,
    IconClock as Clock
} from "@/components/icons/HoramedIcons";
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
import { motion, AnimatePresence } from "framer-motion";

interface StockTabProps {
    stockProjections: StockProjection[] | undefined;
    isLoading: boolean;
    onUpdateStock: (stockId: string, newUnitsLeft: number) => Promise<void>;
    onNavigateToRoutine: () => void;
}

export function StockTab({
    stockProjections,
    isLoading,
    onUpdateStock,
    onNavigateToRoutine,
}: StockTabProps) {
    const { t } = useTranslation();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
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
        if (percentage <= 10) return { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: t('meds.critical') };
        if (percentage <= 20) return { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", label: t('meds.low') };
        if (percentage <= 50) return { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: t('meds.medium') };
        return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: t('meds.good') };
    };

    return (
        <div className="space-y-6 mt-6 pb-20">
            <TutorialHint
                id={t('tutorials.estoque.id')}
                title={t('tutorials.estoque.title')}
                message={t('tutorials.estoque.message')}
                className="rounded-[2rem] border-white/5 shadow-glass"
            />

            <div className="card-interactive rounded-[2.5rem] p-6 border border-white/10 overflow-hidden relative group">
                <div className="flex items-start gap-4 transition-transform group-hover:scale-[1.01] duration-500">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow shadow-primary/20">
                        <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-foreground/90 uppercase tracking-widest italic">{t('stock.howItWorks')}</h3>
                            <HelpTooltip content={t('tutorials.estoque.message')} iconSize="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('stock.howItWorksDesc') }} />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-glow shadow-primary/30" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">{t('stock.loading')}</p>
                </div>
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
                    {stockProjections?.map((item, idx) => {
                        const percentage = (item.currentQty / item.unitsTotal) * 100;
                        const status = getStockStatus(item.currentQty, item.unitsTotal);
                        const isExpanded = expandedItems.has(item.id);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`card-interactive rounded-[2rem] border border-white/10 overflow-hidden`}
                            >
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">{item.itemName}</h3>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.color} ${status.border} backdrop-blur-sm`}>
                                                    {status.label}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-muted-foreground uppercase leading-none">
                                                    <span className={`text-lg leading-none ${status.color}`}>{item.currentQty}</span>
                                                    <span className="opacity-60">de</span>
                                                    <span>{item.unitsTotal} unid.</span>
                                                </div>
                                            </div>

                                            <StockOriginBadge
                                                prescriptionId={item.createdFromPrescriptionId}
                                                prescriptionTitle={item.prescriptionTitle}
                                                lastRefillAt={item.lastRefillAt}
                                            />
                                        </div>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="icon" variant="soft" className="w-11 h-11 rounded-2xl shadow-none">
                                                    <Edit className="h-6 w-6" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2.5rem] p-8 border-white/10 shadow-glass">
                                                <DialogHeader className="space-y-3">
                                                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Ajustar estoque</DialogTitle>
                                                    <DialogDescription className="text-sm font-medium text-muted-foreground">
                                                        {item.itemName} • Atualize a quantidade disponível sem sair da tela
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-8 py-6">
                                                    <div className="flex flex-col items-center gap-1 rounded-3xl border border-border/50 bg-muted/30 p-6">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estoque atual</Label>
                                                        <div className="text-5xl font-black tracking-tighter text-foreground">
                                                            {item.currentQty}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">unidades</span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="adjustment" className="text-xs font-black uppercase tracking-widest px-1">Quantidade para Ajustar</Label>
                                                        <Input
                                                            id="adjustment"
                                                            type="number"
                                                            min="1"
                                                            placeholder="0"
                                                            value={adjustmentAmount || ""}
                                                            onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                                                            className="h-16 rounded-2xl bg-card/40 border-white/10 text-center text-3xl font-black focus:border-primary/50"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Button
                                                            onClick={async () => {
                                                                await onUpdateStock(item.id, item.currentQty + adjustmentAmount);
                                                            }}
                                                            disabled={adjustmentAmount <= 0}
                                                            variant="success"
                                                            className="h-16 rounded-3xl gap-3 text-base font-semibold"
                                                        >
                                                            <Plus className="h-6 w-6" />
                                                            Repor
                                                        </Button>
                                                        <Button
                                                            onClick={() => onUpdateStock(item.id, Math.max(0, item.currentQty - adjustmentAmount))}
                                                            disabled={adjustmentAmount <= 0}
                                                            variant="outline"
                                                            className="h-16 rounded-3xl gap-3 border-destructive/20 bg-transparent text-base font-semibold text-destructive hover:border-destructive/40 hover:bg-destructive/5"
                                                        >
                                                            <AlertTriangle className="h-6 w-6 text-destructive" />
                                                            Remover
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className={`h-full rounded-full ${percentage <= 10 ? "bg-destructive" : percentage <= 20 ? "bg-orange-500" : "bg-primary"
                                                    } shadow-[0_0_12px_rgba(var(--primary),0.4)]`}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {Math.round(percentage)}% disponível
                                            </span>
                                            {item.daysRemaining !== null && item.daysRemaining > 0 && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-black uppercase ${item.daysRemaining <= 7 ? "text-destructive" : item.daysRemaining <= 14 ? "text-orange-500" : "text-primary"
                                                    }`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    ~{item.daysRemaining} dias
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {percentage <= 20 && (
                                        <div className={`flex items-start gap-4 p-4 rounded-3xl border ${percentage <= 10 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-orange-500/10 border-orange-500/20 text-orange-600"
                                            }`}>
                                            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-black uppercase tracking-widest">
                                                    {percentage <= 10 ? "Alerta Crítico" : "Aviso de Estoque"}
                                                </p>
                                                <p className="text-xs font-semibold opacity-80">
                                                    {percentage <= 10 ? `Apenas ${item.currentQty} unidades restantes no armário.` : `Seu estoque está baixando. Considere repor brevemente.`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)} className="w-full">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="secondary" className="h-11 w-full rounded-2xl font-semibold text-foreground">
                                                {isExpanded ? 'Ocultar detalhes' : 'Ver consumo e histórico'}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-6 pt-6 overflow-hidden">
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
                                                    <StockConsumptionChart
                                                        itemName={item.itemName}
                                                        takenCount={item.takenCount7d}
                                                        scheduledCount={item.scheduledCount7d}
                                                        adherence={item.adherence7d}
                                                        trend={item.consumptionTrend}
                                                        unitsLeft={item.currentQty}
                                                        unitsTotal={item.unitsTotal}
                                                    />
                                                </div>
                                                <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
                                                    <StockTimeline
                                                        itemName={item.itemName}
                                                        consumptionHistory={item.consumptionHistory}
                                                        dailyAvg={item.dailyConsumptionAvg}
                                                        daysRemaining={item.daysRemaining}
                                                    />
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
