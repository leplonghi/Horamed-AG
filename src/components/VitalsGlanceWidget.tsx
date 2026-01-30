import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCollection, orderBy, fetchDocument, limit } from "@/integrations/firebase";
import { useAuth } from "@/integrations/firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface VitalsGlanceWidgetProps {
    profileId?: string;
}

export default function VitalsGlanceWidget({ profileId }: VitalsGlanceWidgetProps) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();

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

    // Fetch height for BMI
    const { data: userProfile } = useQuery({
        queryKey: ["user-profile-glance", user?.uid],
        queryFn: async () => {
            if (!user) return null;
            // Correct usage: collection, docId
            const { data } = await fetchDocument<any>('users', user.uid);
            return data || null;
        },
        enabled: !!user,
    });

    // -- Helpers --
    const calculateBMI = (weight: number, heightCm?: number) => {
        if (!heightCm) return null;
        const h = heightCm / 100;
        return (weight / (h * h)).toFixed(1);
    };

    const getPressureStatus = (systolic: number, diastolic: number) => {
        if (systolic >= 140 || diastolic >= 90) return { label: language === 'pt' ? 'Alta' : 'High', color: 'text-red-500', bg: 'bg-red-500/10' };
        if (systolic >= 120 && systolic < 130 && diastolic < 80) return { label: language === 'pt' ? 'Elevada' : 'Elevated', color: 'text-amber-500', bg: 'bg-amber-500/10' };
        return { label: 'Normal', color: 'text-green-500', bg: 'bg-green-500/10' };
    };

    const bmi = weightLog && userProfile?.heightCm ? calculateBMI(weightLog.weightKg, userProfile.heightCm) : null;
    const pressureStatus = pressureLog ? getPressureStatus(pressureLog.systolic, pressureLog.diastolic) : null;

    if (!weightLog && !pressureLog && !loadingWeight) return null; // Don't show if empty

    return (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Weight Card */}
            <Card
                className="border-0 shadow-sm bg-card hover:bg-muted/50 transition-all cursor-pointer group overflow-hidden relative"
                onClick={() => navigate('/sinais-vitais?tab=weight')}
            >
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-60" />
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600">
                            <Scale className="h-4 w-4" />
                        </div>
                        {bmi && (
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground")}>
                                IMC {bmi}
                            </span>
                        )}
                    </div>
                    <div>
                        {loadingWeight ? (
                            <Skeleton className="h-6 w-16 mb-1" />
                        ) : weightLog ? (
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold">{weightLog.weightKg}</span>
                                <span className="text-xs text-muted-foreground">kg</span>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">{language === 'pt' ? 'Registrar' : 'Record'}</span>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{language === 'pt' ? 'Peso' : 'Weight'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Pressure Card */}
            <Card
                className="border-0 shadow-sm bg-card hover:bg-muted/50 transition-all cursor-pointer group overflow-hidden relative"
                onClick={() => navigate('/sinais-vitais?tab=pressure')}
            >
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-60" />
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-1.5 bg-red-500/10 rounded-lg text-red-600">
                            <Heart className="h-4 w-4" />
                        </div>
                        {pressureStatus && (
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize", pressureStatus.bg, pressureStatus.color)}>
                                {pressureStatus.label}
                            </span>
                        )}
                    </div>
                    <div>
                        {loadingPressure ? (
                            <Skeleton className="h-6 w-20 mb-1" />
                        ) : pressureLog ? (
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-bold">{pressureLog.systolic}</span>
                                <span className="text-xs text-muted-foreground mx-0.5">/</span>
                                <span className="text-lg font-semibold text-muted-foreground">{pressureLog.diastolic}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">{language === 'pt' ? 'Registrar' : 'Record'}</span>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{language === 'pt' ? 'Pressão Arterial' : 'Blood Pressure'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
