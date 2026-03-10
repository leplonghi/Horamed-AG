import { cn } from "@/lib/utils";
import TutorialHint from "@/components/TutorialHint";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { EmptyStatePro } from "@/components/ui/EmptyStatePro";
import {
    IconClock as History,
    IconRefresh as RefreshCw,
    IconArrowRight as ArrowRight,
    IconPill as Pill
} from "@/components/icons/HoramedIcons";
import DoseTimeline from "@/components/DoseTimeline";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HistoryTabProps {
    doses: any[];
    isLoading: boolean;
    onRefresh: () => void;
}

export function HistoryTab({ doses, isLoading, onRefresh }: HistoryTabProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="space-y-6 mt-6 pb-20">
            <TutorialHint
                id={t('tutorials.historico.id')}
                title={t('tutorials.historico.title')}
                message={t('tutorials.historico.message')}
                className="rounded-[2rem] border-white/5 shadow-glass"
            />

            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow shadow-primary/20">
                        <History className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black text-foreground/90 uppercase tracking-tighter italic leading-none">
                            {t('history.recentTitle') || "Registros"}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Atividade Recente</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="w-10 h-10 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 hover:bg-card/60 transition-all shadow-glass"
                >
                    <RefreshCw className={cn("h-5 w-5 text-primary", isLoading && "animate-spin")} />
                </Button>
            </div>

            {isLoading && doses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-glow shadow-primary/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <History className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
                </div>
            ) : doses.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="card-interactive rounded-[2.5rem] p-6 border border-white/10 overflow-hidden">
                        <DoseTimeline doses={doses} period="month" />
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full h-14 rounded-3xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-black uppercase tracking-widest transition-all gap-3 shadow-glow shadow-primary/10"
                        onClick={() => navigate('/historico-medicamentos')}
                    >
                        {t('history.viewFullHistory') || "Ver Tudo"}
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </motion.div>
            ) : (
                <EmptyStatePro
                    title={t('history.emptyTitle') || "Vazio por enquanto"}
                    description={t('history.emptyDescription') || "Seus registros de uso aparecerão aqui para você acompanhar sua evolução."}
                    icon={Pill}
                    actionLabel="Adicionar Agora"
                    onAction={() => navigate('/medicamentos?add=true')}
                />
            )}
        </div>
    );
}
