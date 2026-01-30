import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import TutorialHint from "@/components/TutorialHint";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { EmptyStatePro } from "@/components/ui/EmptyStatePro";
import { History, RefreshCw, ArrowRight } from "lucide-react";
import DoseTimeline from "@/components/DoseTimeline";
import { Button } from "@/components/ui/button";

interface HistoryTabProps {
    doses: any[];
    isLoading: boolean;
    onRefresh: () => void;
}

export function HistoryTab({ doses, isLoading, onRefresh }: HistoryTabProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="space-y-6 mt-6">
            <TutorialHint
                id={t('tutorials.historico.id')}
                title={t('tutorials.historico.title')}
                message={t('tutorials.historico.message')}
            />

            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-600" />
                    {t('history.recentTitle') || "Registros Recentes"}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="h-8 gap-1.5"
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    <span className="text-xs">{t('common.refresh') || "Atualizar"}</span>
                </Button>
            </div>

            {isLoading && doses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
            ) : doses.length > 0 ? (
                <div className="space-y-6">
                    <DoseTimeline doses={doses} period="month" />

                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 text-purple-600 font-bold transition-all gap-2"
                        onClick={() => navigate('/historico-medicamentos')}
                    >
                        {t('history.viewFullHistory') || "Ver Histórico Completo"}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <EmptyStatePro
                    title={t('history.emptyTitle') || "Nenhum registro no histórico"}
                    description={t('history.emptyDescription') || "Seus registros de uso de medicamentos aparecerão aqui detalhadamente."}
                    icon={History}
                    actionLabel={t('history.viewFullHistory') || "Adicionar Medicamento"}
                    onAction={() => navigate('/medicamentos?add=true')}
                />
            )}
        </div>
    );
}
