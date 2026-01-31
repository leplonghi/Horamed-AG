import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { activatePremiumDays } from '@/services/RewardsService';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export function FreeRewardsCard() {
    const { user } = useAuth();
    const [isActivating, setIsActivating] = useState(false);

    const { data: rewards } = useQuery({
        queryKey: ['premium-days', user?.uid],
        queryFn: async () => {
            if (!user?.uid) return null;
            const docRef = doc(db, `users/${user.uid}/rewards/premiumDays`);
            const snapshot = await getDoc(docRef);
            return snapshot.data() || { remaining: 0, earned: 0 };
        },
        enabled: !!user?.uid,
    });

    const handleActivate = async () => {
        if (!rewards?.remaining || rewards.remaining <= 0) return;

        setIsActivating(true);
        try {
            await activatePremiumDays(user!.uid, Math.min(rewards.remaining, 7)); // Ativa máx 7 dias por vez
            toast.success('Premium ativado com sucesso! Aproveite.');
            // Invalidate queries would go here
        } catch (error) {
            toast.error('Erro ao ativar Premium.');
            console.error(error);
        } finally {
            setIsActivating(false);
        }
    };

    const remaining = rewards?.remaining || 0;

    return (
        <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Crown size={120} />
            </div>

            <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                            Free Rewards
                        </Badge>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Dias Premium Grátis
                            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </CardTitle>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {remaining}
                        </span>
                        <span className="text-sm text-muted-foreground block">dias disponíveis</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Mantenha seus streaks e convide amigos para ganhar dias de acesso ilimitado.
                </p>

                {/* Milestone Progress Mockup - Idealmente viria do backend */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span>Próxima recompensa (7 dias streak)</span>
                        <span>5/7 dias</span>
                    </div>
                    <Progress value={71} className="h-2 bg-purple-100 dark:bg-purple-950/50" />
                </div>

                <div className="pt-2">
                    {remaining > 0 ? (
                        <Button
                            onClick={handleActivate}
                            disabled={isActivating}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
                        >
                            {isActivating ? (
                                'Ativando...'
                            ) : (
                                <>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Ativar 7 Dias de Premium
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button variant="outline" className="w-full group">
                            <span className="mr-2">Ver como ganhar mais</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
