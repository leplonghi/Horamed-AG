import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCollection, orderBy, fetchDocument, limit } from "@/integrations/firebase";
import { useAuth } from "@/integrations/firebase/auth";
import { db } from "@/integrations/firebase/client";
import { doc, deleteDoc } from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Activity, Scale, Heart, Droplets, ArrowLeft, Plus, History,
    ChevronRight, Info, Camera, MoreHorizontal, Trash2, Calendar as CalendarIcon,
    TrendingUp, AlertTriangle
} from "lucide-react";
import VitalsRegistrationModal, { VitalType } from "@/components/VitalsRegistrationModal";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// -- COMPONENTS --

const MetricGauge = ({ value, min, max, ranges, unit }: { value: number, min: number, max: number, ranges: any[], unit: string }) => {
    const PERCENT_MIN = 0;
    const PERCENT_MAX = 100;
    const totalRange = max - min;
    const relativeValue = value - min;
    const percentage = Math.min(Math.max((relativeValue / totalRange) * 100, PERCENT_MIN), PERCENT_MAX);

    return (
        <div className="w-full mt-6 mb-2 select-none">
            <div className="relative h-4 w-full rounded-full bg-muted/30 overflow-hidden flex">
                {ranges.map((range, i) => (
                    <div key={i} className={cn("h-full flex-1 border-r border-background/50 last:border-0", range.color)} />
                ))}
            </div>
            <div className="absolute w-1 h-3 -mt-3.5 bg-foreground rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 transition-all duration-700 ease-out"
                style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                    {value} {unit}
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 rounded-[1px]" />
                </div>
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
                {ranges.map((range: any, i: number) => (
                    <span key={i} className={cn("flex-1 truncate", i === 0 ? 'text-left' : i === ranges.length - 1 ? 'text-right' : 'text-center')}>{range.label}</span>
                ))}
            </div>
        </div>
    );
};

export default function HealthVitals() {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Support both 'metric' (new) and 'tab' (legacy/widget) params
    const activeMetric = (searchParams.get("metric") || searchParams.get("tab")) as VitalType | null;
    const profileId = searchParams.get("profile");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeTabForModal, setActiveTabForModal] = useState<VitalType>('weight');

    const dateLocale = language === 'pt' ? ptBR : enUS;

    // -- QUERIES --
    const fetchPath = (metric: string) => profileId ? `users/${user?.uid}/profiles/${profileId}/${metric}Logs` : `users/${user?.uid}/${metric}Logs`;

    const { data: userProfile } = useQuery({
        queryKey: ["user-profile-vitals", user?.uid],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await fetchDocument<any>('users', user.uid);
            return data || null;
        },
        enabled: !!user
    });

    const { data: weightLogs, refetch: refetchWeight } = useQuery({
        queryKey: ["weight-logs", user?.uid, profileId],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await fetchCollection<any>(fetchPath('weight'), [orderBy("recordedAt", "desc")]);
            return data || [];
        },
        enabled: !!user,
    });

    const { data: pressureLogs, refetch: refetchPressure } = useQuery({
        queryKey: ["pressure-logs", user?.uid, profileId],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await fetchCollection<any>(fetchPath('pressure'), [orderBy("recordedAt", "desc")]);
            return data || [];
        },
        enabled: !!user,
    });

    const { data: glucoseLogs, refetch: refetchGlucose } = useQuery({
        queryKey: ["glucose-logs", user?.uid, profileId],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await fetchCollection<any>(fetchPath('glucose'), [orderBy("recordedAt", "desc")]);
            return data || [];
        },
        enabled: !!user,
    });

    // -- COMPUTED --
    const latestWeight = weightLogs?.[0];
    const latestPressure = pressureLogs?.[0];
    const latestGlucose = glucoseLogs?.[0];

    // -- ACTIONS --
    const handleDelete = async () => {
        if (!deleteId || !user || !activeMetric) return;
        try {
            await deleteDoc(doc(db, fetchPath(activeMetric), deleteId));
            toast.success(language === 'pt' ? "Registro excluído" : "Record deleted");
            if (activeMetric === 'weight') refetchWeight();
            if (activeMetric === 'pressure') refetchPressure();
            if (activeMetric === 'glucose') refetchGlucose();
        } catch (error) {
            console.error(error);
            toast.error(language === 'pt' ? "Erro ao excluir" : "Error deleting");
        } finally {
            setDeleteId(null);
        }
    };

    const handleOpenModal = (metric?: VitalType) => {
        setActiveTabForModal(metric || activeMetric || 'weight');
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        refetchWeight();
        refetchPressure();
        refetchGlucose();
    };

    const navigateToDetail = (metric: VitalType) => {
        setSearchParams({ metric });
    };

    // -- RENDER HELPERS --
    const getPressureStatus = (systolic: number, diastolic: number) => {
        if (systolic >= 140 || diastolic >= 90) return { label: language === 'pt' ? 'Alta' : 'High', color: 'text-red-500', bg: 'bg-red-500/10' };
        if (systolic >= 120) return { label: language === 'pt' ? 'Elevada' : 'Elevated', color: 'text-amber-500', bg: 'bg-amber-500/10' };
        return { label: 'Normal', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    };

    const getChartData = (logs: any[]) => {
        if (!logs) return [];
        return [...logs].reverse().map(log => ({
            date: format(new Date(log.recordedAt), "dd/MM", { locale: dateLocale }),
            value: activeMetric === 'weight' ? log.weightKg : (activeMetric === 'glucose' ? log.value : 0),
            systolic: activeMetric === 'pressure' ? log.systolic : 0,
            diastolic: activeMetric === 'pressure' ? log.diastolic : 0,
        }));
    };

    // -- VIEWS --

    // 1. HUB VIEW (Dashboard)
    if (!activeMetric) {
        return (
            <div className="min-h-screen bg-background/95 pb-20">
                <Header />
                <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold tracking-tight">{language === 'pt' ? 'Saúde' : 'Health'}</h1>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal('weight')}>
                            <Plus className="h-6 w-6 text-primary" />
                        </Button>
                    </div>

                    {/* Weight Card */}
                    <Card className="border-0 shadow-sm bg-card hover:bg-muted/40 transition-all cursor-pointer group" onClick={() => navigateToDetail('weight')}>
                        <CardContent className="p-5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                    <Scale className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{language === 'pt' ? 'Peso' : 'Weight'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {latestWeight
                                            ? format(new Date(latestWeight.recordedAt), "d MMM", { locale: dateLocale })
                                            : (language === 'pt' ? 'Sem dados' : 'No data')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{latestWeight?.weightKg || '--'} <span className="text-sm font-medium text-muted-foreground">kg</span></p>
                                {userProfile?.heightCm && latestWeight && (
                                    <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-2">
                                        IMC {((latestWeight.weightKg / ((userProfile.heightCm / 100) ** 2))).toFixed(1)}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pressure Card */}
                    <Card className="border-0 shadow-sm bg-card hover:bg-muted/40 transition-all cursor-pointer group" onClick={() => navigateToDetail('pressure')}>
                        <CardContent className="p-5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
                                    <Heart className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{language === 'pt' ? 'Pressão' : 'Blood Pressure'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {latestPressure
                                            ? format(new Date(latestPressure.recordedAt), "d MMM", { locale: dateLocale })
                                            : (language === 'pt' ? 'Sem dados' : 'No data')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">
                                    {latestPressure ? `${latestPressure.systolic}/${latestPressure.diastolic}` : '--/--'}
                                    <span className="text-sm font-medium text-muted-foreground ml-1">mmHg</span>
                                </p>
                                {latestPressure && (
                                    <Badge variant="outline" className={cn("mt-1 text-[10px] h-5 px-2 border-0", getPressureStatus(latestPressure.systolic, latestPressure.diastolic).bg, getPressureStatus(latestPressure.systolic, latestPressure.diastolic).color)}>
                                        {getPressureStatus(latestPressure.systolic, latestPressure.diastolic).label}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Glucose Card */}
                    <Card className="border-0 shadow-sm bg-card hover:bg-muted/40 transition-all cursor-pointer group" onClick={() => navigateToDetail('glucose')}>
                        <CardContent className="p-5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                    <Droplets className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{language === 'pt' ? 'Glicose' : 'Glucose'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {latestGlucose
                                            ? format(new Date(latestGlucose.recordedAt), "d MMM", { locale: dateLocale })
                                            : (language === 'pt' ? 'Sem dados' : 'No data')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{latestGlucose?.value || '--'} <span className="text-sm font-medium text-muted-foreground">mg/dL</span></p>
                                {latestGlucose && (
                                    <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-2">
                                        {latestGlucose.context === 'fasting' ? (language === 'pt' ? 'Jejum' : 'Fasting') : (language === 'pt' ? 'Pós-Refeição' : 'Post-Meal')}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </main>
                <VitalsRegistrationModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={handleSuccess} defaultTab={activeTabForModal} profileId={profileId || undefined} />
            </div>
        );
    }

    // 2. DETAIL VIEW
    const currentLogs = activeMetric === 'weight' ? weightLogs : activeMetric === 'pressure' ? pressureLogs : glucoseLogs;
    const color = activeMetric === 'weight' ? 'blue' : activeMetric === 'pressure' ? 'red' : 'amber';
    const unit = activeMetric === 'weight' ? 'kg' : activeMetric === 'pressure' ? 'mmHg' : 'mg/dL';
    const themeColor = activeMetric === 'weight' ? 'text-blue-600' : activeMetric === 'pressure' ? 'text-red-600' : 'text-amber-600';
    const themeBg = activeMetric === 'weight' ? 'bg-blue-500' : activeMetric === 'pressure' ? 'bg-red-500' : 'bg-amber-500';

    return (
        <div className="min-h-screen bg-background/95 pb-20">
            <Header />
            <main className="container mx-auto px-4 py-4 space-y-6 max-w-lg">
                {/* Detail Header */}
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSearchParams({})} className="rounded-full h-10 w-10 -ml-2">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight capitalize">
                            {activeMetric === 'weight' ? (language === 'pt' ? 'Peso' : 'Weight') :
                                activeMetric === 'pressure' ? (language === 'pt' ? 'Pressão' : 'BP') :
                                    (language === 'pt' ? 'Glicose' : 'Glucose')}
                        </h1>
                    </div>
                    <Button size="icon" className={cn("rounded-full", themeBg)} onClick={() => handleOpenModal()}>
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </div>

                {/* Main Visualization Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="p-0">
                            {/* Gauge Section */}
                            {activeMetric === 'weight' && latestWeight && userProfile?.heightCm && (
                                <div className="mb-6">
                                    <MetricGauge
                                        value={parseFloat((latestWeight.weightKg / ((userProfile.heightCm / 100) ** 2)).toFixed(1))}
                                        min={15} max={35}
                                        ranges={[
                                            { limit: 18.5, color: "bg-blue-400", label: 'Baixo' },
                                            { limit: 25, color: "bg-emerald-500", label: 'Normal' },
                                            { limit: 30, color: "bg-amber-400", label: 'Sobrepeso' },
                                            { limit: 40, color: "bg-red-500", label: 'Obesidade' },
                                        ]}
                                        unit="IMC"
                                    />
                                    <p className="text-center text-sm font-medium text-muted-foreground mt-2">
                                        {language === 'pt' ? 'Seu IMC atual baseado em sua altura e peso.' : 'Your current BMI based on height and weight.'}
                                    </p>
                                </div>
                            )}

                            {activeMetric === 'pressure' && latestPressure && (
                                <div className="mb-6">
                                    <MetricGauge
                                        value={latestPressure.systolic}
                                        min={90} max={180}
                                        ranges={[
                                            { limit: 120, color: "bg-emerald-500", label: 'Ideal' },
                                            { limit: 130, color: "bg-emerald-400", label: 'Normal' },
                                            { limit: 140, color: "bg-amber-500", label: 'Elevada' },
                                            { limit: 180, color: "bg-red-500", label: 'Hiper' },
                                        ]}
                                        unit="Sistólica"
                                    />
                                </div>
                            )}

                            {/* Chart */}
                            <div className="h-[250px] w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                                <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-widest">{language === 'pt' ? 'Evolução' : 'Trend'}</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={getChartData(currentLogs || [])}>
                                        <defs>
                                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={`var(--${color}-500)`} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={`var(--${color}-500)`} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }} />
                                        {activeMetric === 'pressure' ? (
                                            <>
                                                <Area type="monotone" dataKey="systolic" stroke="#ef4444" fillOpacity={0} strokeWidth={3} />
                                                <Area type="monotone" dataKey="diastolic" stroke="#3b82f6" fillOpacity={0} strokeWidth={3} />
                                            </>
                                        ) : (
                                            <Area type="monotone" dataKey="value" stroke={themeColor.replace('text-', '')} fill="url(#splitColor)" strokeWidth={3} />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History List */}
                <div className="space-y-4 pt-4">
                    <h3 className="font-bold text-xl">{language === 'pt' ? 'Histórico' : 'History'}</h3>
                    <div className="space-y-3">
                        {currentLogs?.map((log: any) => (
                            <div key={log.id} className="group flex justify-between items-center p-4 bg-card rounded-xl border border-border/50 hover:border-border transition-all">
                                <div>
                                    <p className="font-bold text-lg">
                                        {activeMetric === 'weight' ? log.weightKg :
                                            activeMetric === 'pressure' ? `${log.systolic}/${log.diastolic}` :
                                                log.value}
                                        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {format(new Date(log.recordedAt), "PPP, p", { locale: dateLocale })}
                                        </span>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(log.id)}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {language === 'pt' ? 'Excluir' : 'Delete'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                        {!currentLogs?.length && (
                            <div className="p-8 text-center text-muted-foreground">
                                {language === 'pt' ? 'Nenhum registro encontrado.' : 'No records found.'}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <VitalsRegistrationModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={handleSuccess} defaultTab={activeTabForModal} profileId={profileId || undefined} />

            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{language === 'pt' ? 'Tem certeza?' : 'Are you sure?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {language === 'pt' ? 'Esta ação não pode ser desfeita.' : 'This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{language === 'pt' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {language === 'pt' ? 'Excluir' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
