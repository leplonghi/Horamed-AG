import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCollection, orderBy, fetchDocument, limit } from "@/integrations/firebase";
import { useAuth } from "@/integrations/firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Heart, Flame, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { motion } from "framer-motion";

interface VitalsGlanceWidgetProps {
    profileId?: string;
}

export default function VitalsGlanceWidget({ profileId }: VitalsGlanceWidgetProps) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const streakData = useStreakCalculator();

    // -- Queries --
    const { data: weightLog, isLoading: loadingWeight } = useQuery({
        queryKey: ["latest-weight-glance", user?.uid, profileId],
        queryFn: async () => {
            if (!user) return null;
            const path = profileId ? `users/${user.uid}/profiles/${profileId}/weightLogs` : `users/${user.uid}/weightLogs`;
            const { data } = await fetchCollection<any>(path, [orderBy("recordedAt", "desc"), limit(1)]);
            return data?.[0] || null;
        },
        enabled: !!user,
    });

    const { data: pressureLog, isLoading: loadingPressure } = useQuery({
        queryKey: ["latest-pressure-glance", user?.uid, profileId],
        queryFn: async () => {
            if (!user) return null;
            const path = profileId ? `users/${user.uid}/profiles/${profileId}/pressureLogs` : `users/${user.uid}/pressureLogs`;
            const { data } = await fetchCollection<any>(path, [orderBy("recordedAt", "desc"), limit(1)]);
            return data?.[0] || null;
        },
        enabled: !!user,
    });

    // -- Helpers --
    const getPressureColor = (systolic: number, diastolic: number) => {
        if (systolic >= 140 || diastolic >= 90) return "text-red-500 bg-red-50";
        if (systolic >= 120 || diastolic >= 80) return "text-orange-500 bg-orange-50";
        return "text-emerald-500 bg-emerald-50";
    };

    const pulse = pressureLog?.pulse || "--";

    // Animation variants for the cards
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 mb-6"
        >
            {/* Card 1: Heart/Pressure (Matches Reference 'Heart') */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all rounded-[1.5rem] overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate('/sinais-vitais?tab=pressure')}
                >
                    <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <div className={cn("p-2 rounded-xl", pressureLog ? getPressureColor(pressureLog.systolic, pressureLog.diastolic) : "bg-red-50 text-red-500")}>
                                <Heart className="h-5 w-5 fill-current" />
                            </div>
                        </div>
                        <div className="mt-3">
                            {loadingPressure ? (
                                <Skeleton className="h-6 w-16" />
                            ) : (
                                <div>
                                    <div className="flex items-baseline mb-0.5">
                                        <span className="text-xl font-bold text-slate-800">
                                            {pressureLog ? pressureLog.systolic : '--'}
                                        </span>
                                        <span className="text-sm text-slate-400 mx-0.5">/</span>
                                        <span className="text-lg font-medium text-slate-500">
                                            {pressureLog ? pressureLog.diastolic : '--'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                        {language === 'pt' ? 'Pressão' : 'Pressure'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Card 2: Weight (Matches Reference but adapted) */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all rounded-[1.5rem] overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate('/sinais-vitais?tab=weight')}
                >
                    <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                                <Scale className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            {loadingWeight ? (
                                <Skeleton className="h-6 w-16" />
                            ) : (
                                <div>
                                    <div className="flex items-baseline mb-0.5">
                                        <span className="text-xl font-bold text-slate-800">
                                            {weightLog ? weightLog.weightKg : '--'}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-400 ml-1">kg</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                        {language === 'pt' ? 'Peso' : 'Weight'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Card 3: Streak (Matches Reference 'Activity/Fire') */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all rounded-[1.5rem] overflow-hidden cursor-pointer h-full bg-gradient-to-br from-orange-500 to-amber-500"
                    onClick={() => navigate('/progresso')}
                >
                    <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px] text-white">
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-xl bg-white/20">
                                <Flame className="h-5 w-5 text-white fill-current" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline mb-0.5">
                                <span className="text-xl font-bold">
                                    {streakData.currentStreak}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium text-white/80 uppercase tracking-widest">
                                {language === 'pt' ? 'Dias Seguidos' : 'Streak'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Card 4: Pulse / Activity (Matches Reference 'Steps') */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all rounded-[1.5rem] overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate('/sinais-vitais')}
                >
                    <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <div className="p-2 rounded-xl bg-teal-50 text-teal-500">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div>
                                <div className="flex items-baseline mb-0.5">
                                    <span className="text-xl font-bold text-slate-800">
                                        {pulse}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-400 ml-1">bpm</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    {language === 'pt' ? 'Pulso' : 'Pulse'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
