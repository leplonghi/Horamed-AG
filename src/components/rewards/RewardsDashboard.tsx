import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FreeRewardsCard } from './FreeRewardsCard';
import { PremiumRewardsCard } from './PremiumRewardsCard';
import { Gift, Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

export function RewardsDashboard() {
    const { user } = useAuth();
    const { isPremium } = useSubscription();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                    Suas Recompensas
                </h2>
                <Button variant="ghost" size="sm" className="gap-2 text-purple-600 dark:text-purple-400">
                    <Share2 className="w-4 h-4" />
                    Convidar Amigos
                </Button>
            </div>

            {/* Cartão Principal (Condicional Free/Premium) */}
            {isPremium ? <PremiumRewardsCard /> : <FreeRewardsCard />}

            {/* Programa de Indicação (Resumo) */}
            <Card>
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
                    <Button variant="outline" onClick={() => navigate('/perfil/indique-e-ganhe')}>Ver Detalhes</Button>
                </CardContent>
            </Card>

            {/* Sorteios Ativos (Placeholder) */}
            <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-900">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-full text-pink-600 dark:text-pink-400">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-pink-700 dark:text-pink-300">Sorteio Mensal Ativo!</h3>
                            <p className="text-sm text-pink-600/80 dark:text-pink-400/80">
                                Concorra a 1 ano de Premium Grátis. Faltam 3 dias.
                            </p>
                        </div>
                    </div>
                    <Button className="bg-pink-600 hover:bg-pink-700 text-white border-none shadow-md shadow-pink-500/20">
                        Participar
                    </Button>
                </CardContent>
            </Card>

            <div className="text-center pt-2">
                <Button variant="link" size="sm" className="text-muted-foreground text-xs h-auto p-0" onClick={() => navigate('/termos')}>
                    Ver termos e condições do programa
                </Button>
            </div>
        </div >
    );
}
