import { Wallet, TrendingUp, CalendarCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/format';

export function PremiumRewardsCard() {
    const { user } = useAuth();

    const { data: credits } = useQuery({
        queryKey: ['credits', user?.uid],
        queryFn: async () => {
            if (!user?.uid) return null;
            const docRef = doc(db, `users/${user.uid}/rewards/credits`);
            const snapshot = await getDoc(docRef);
            return snapshot.data() || { balance: 0, lifetime: 0 };
        },
        enabled: !!user?.uid,
    });

    const { data: protections } = useQuery({
        queryKey: ['protections', user?.uid],
        queryFn: async () => {
            if (!user?.uid) return null;
            const docRef = doc(db, `users/${user.uid}/rewards/protections`);
            const snapshot = await getDoc(docRef);
            const data = snapshot.data();
            return {
                available: data?.available || 0,
                monthly: data?.monthly?.remaining || 0,
                bonus: data?.bonus?.remaining || 0
            };
        },
        enabled: !!user?.uid,
    });

    const balance = credits?.balance || 0;
    const monthlyPrice = 19.90;
    const nextPayment = Math.max(0, monthlyPrice - balance);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Wallet / Credits Card */}
            <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Wallet size={120} />
                </div>

                <CardHeader className="relative z-10 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant="secondary" className="mb-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                Premium Cashback
                            </Badge>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                Seus Créditos
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </CardTitle>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(balance)}
                            </span>
                            <span className="text-sm text-muted-foreground block">disponível</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 backdrop-blur-sm border border-emerald-100 dark:border-emerald-900/50">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <CalendarCheck className="w-4 h-4" />
                                Próxima renovação
                            </span>
                            <span className="font-semibold">{formatCurrency(nextPayment)}</span>
                        </div>
                        {balance > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 text-right">
                                Economia de {formatCurrency(Math.min(balance, monthlyPrice))} aplicada automaticamente
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Protections Card */}
            <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <ShieldCheck size={120} />
                </div>

                <CardHeader className="relative z-10 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                Streak Protection
                            </Badge>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                Proteções
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                            </CardTitle>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {protections?.available || 0}
                            </span>
                            <span className="text-sm text-muted-foreground block">ativas</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10">
                    <div className="flex gap-2 mb-4">
                        {/* Visualização de escudos */}
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-8 h-10 rounded-b-full flex items-center justify-center border-2 transition-all ${i < (protections?.available || 0)
                                        ? 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-300'
                                    }`}
                            >
                                <ShieldCheck size={16} />
                            </div>
                        ))}
                        {(protections?.available || 0) > 3 && (
                            <div className="flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                                +{(protections?.available || 0) - 3}
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {protections?.monthly || 0} mensais + {protections?.bonus || 0} bônus acumulados.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
