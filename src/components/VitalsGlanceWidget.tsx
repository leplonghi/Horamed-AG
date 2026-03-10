import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCollection, orderBy, fetchDocument, limit } from "@/integrations/firebase";
import { useAuth } from "@/integrations/firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Scales as Scale, Heart, Flame, Heartbeat as Activity } from "@phosphor-icons/react";
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
        return "text-blue-500 bg-blue-50";
    };

    const pulse = pressureLog?.pulse || "--";

    // Animation variants for the cards
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-2 mb-4"
        >
            {/* Card 1: Heart/Pressure */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate('/sinais-vitais?tab=pressure')}
                >
                    <CardContent className="p-3 flex flex-col justify-between h-full min-h-[90px]">
                        <div className="flex justify-between items-start">
                            <div className={cn("p-1.5 rounded-lg", pressureLog ? getPressureColor(pressureLog.systolic, pressureLog.diastolic) : "bg-red-50 text-red-500")}>
                                <Heart className="h-4 w-4 fill-current" />
                            </div>
                        </div>
                        <div className="mt-2">
                            {loadingPressure ? (
                                <Skeleton className="h-6 w-16" />
                            ) : (
                                <div>
                                    <div className="flex items-baseline mb-0">
                                        <span className="text-lg font-black text-slate-800 tracking-tighter">
                                            {pressureLog ? pressureLog.systolic : '--'}
                                        </span>
                                        <span className="text-xs text-slate-400 mx-0.5 font-bold">/</span>
                                        <span className="text-base font-bold text-slate-500 tracking-tighter">
                                            {pressureLog ? pressureLog.diastolic : '--'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {language === 'pt' ? 'Pressão' : 'Pressure'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Card 2: Weight */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate('/sinais-vitais?tab=weight')}
                >
                    <CardContent className="p-3 flex flex-col justify-between h-full min-h-[90px]">
                        <div className="flex justify-between items-start">
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
                                <Scale className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2">
                            {loadingWeight ? (
                                <Skeleton className="h-6 w-16" />
                            ) : (
                                <div>
                                    <div className="flex items-baseline mb-0">
                                        <span className="text-lg font-black text-slate-800 tracking-tighter">
                                            {weightLog ? weightLog.weightKg : '--'}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 ml-0.5">KG</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {language === 'pt' ? 'Peso' : 'Weight'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Card 3: Streak */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer h-full bg-gradient-to-br from-orange-500 to-amber-500"
                    onClick={() => navigate('/progresso')}
                >
                    <CardContent className="p-3 flex flex-col justify-between h-full min-h-[90px] text-white">
                        <div className="flex justify-between items-start">
                            <div className="p-1.5 rounded-lg bg-white/20">
                                <Flame className="h-4 w-4 text-white fill-current" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-baseline mb-0">
                                <span className="text-lg font-black tracking-tighter">
                                    {streakData.currentStreak}
                                </span>
                            </div>
                            <p className="text-[9px] font-black text-white/80 uppercase tracking-widest">
                                {language === 'pt' ? 'DIAS' : 'STREAK'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Card 4: Pulse */}
            <motion.div variants={item}>
                <Card
                    className="border-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate('/sinais-vitais')}
                >
                    <CardContent className="p-3 flex flex-col justify-between h-full min-h-[90px]">
                        <div className="flex justify-between items-start">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div>
                                <div className="flex items-baseline mb-0">
                                    <span className="text-lg font-black text-slate-800 tracking-tighter">
                                        {pulse}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 ml-0.5">BPM</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
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
