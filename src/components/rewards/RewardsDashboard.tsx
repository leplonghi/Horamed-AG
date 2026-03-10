import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FreeRewardsCard } from './FreeRewardsCard';
import { PremiumRewardsCard } from './PremiumRewardsCard';
import { ShareNetwork as Share2, Users, Gift, ArrowUpRight, ArrowDownRight, Clock } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { useRewardHistory } from '@/hooks/useRewardHistory';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RewardsDashboard() {
    const { user } = useAuth();
    const { isPremium } = useSubscription();
    const { history, isLoading } = useRewardHistory();
    const navigate = useNavigate();

    const getRelativeDate = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        return format(d, "dd 'de' MMM", { locale: ptBR });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600 dark:from-teal-400 dark:to-indigo-400">
                    Suas Recompensas
                </h2>
                <Button variant="ghost" size="sm" className="gap-2 text-teal-600 dark:text-teal-400" onClick={() => navigate('/perfil/indique-e-ganhe')}>
                    <Share2 className="w-4 h-4" />
                    Convidar Amigos
                </Button>
            </div>

            {/* Cartão Principal (Condicional Free/Premium) */}
            {isPremium ? <PremiumRewardsCard /> : <FreeRewardsCard />}

            {/* Programa de Indicação (Resumo) */}
            <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Indique e Ganhe</h3>
                            <p className="text-sm text-muted-foreground">
                                {isPremium
                                    ? 'Ganhe créditos por cada amigo que virar Premium'
                                    : 'Ganhe dias Premium por cada amigo cadastrado'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/perfil/indique-e-ganhe')}>Ver Detalhes</Button>
                </CardContent>
            </Card>

            {/* Histórico de Recompensas */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold px-1">Últimas Atividades</h3>
                <Card className="divide-y divide-zinc-100 dark:divide-zinc-800 border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Carregando suas conquistas...</p>
                        </div>
                    ) : history && history.length > 0 ? (
                        history.slice(0, 5).map((item, idx) => (
                            <div key={item.id || idx} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-xl bg-opacity-10",
                                        item.type === 'positive' || !item.type ? "bg-emerald-500 text-emerald-600" : "bg-amber-500 text-amber-600"
                                    )}>
                                        {item.type === 'positive' || !item.type ? (
                                            <Gift className="w-4 h-4" />
                                        ) : (
                                            <Clock className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.title}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                                            {getRelativeDate(item.date)}
                                            {item.description && <span> • {item.description}</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "text-sm font-black flex items-center gap-1",
                                        item.type === 'positive' || !item.type ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                    )}>
                                        {item.type === 'positive' || !item.type ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-300">
                                <Gift className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">Nenhuma recompensa ainda</p>
                                <p className="text-sm text-muted-foreground">Complete suas doses para ganhar prêmios!</p>
                            </div>
                        </div>
                    )}
                    {(history?.length || 0) > 0 && (
                        <div className="p-3 text-center border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50">
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                VER HISTÓRICO COMPLETO
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

