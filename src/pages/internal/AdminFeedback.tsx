import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCollection } from "@/integrations/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Bug, ThumbsUp, Users, ArrowCounterClockwise as RefreshCcw } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminFeedback() {
    const navigate = useNavigate();
    const { data: feedbacks, loading } = useCollection("feedbacks");

    // Métricas Calculadas
    const [metrics, setMetrics] = useState({
        total: 0,
        nps: { promoter: 0, neutral: 0, detractor: 0 },
        bugs: 0,
        usability: { fast: 0, easy: 0, hard: 0 },
        features: { alarms: 0, stock: 0, game: 0, ai: 0 }
    });

    useEffect(() => {
        if (feedbacks) {
            const newMetrics = {
                total: feedbacks.length,
                nps: { promoter: 0, neutral: 0, detractor: 0 },
                bugs: 0,
                usability: { fast: 0, easy: 0, hard: 0 },
                features: { alarms: 0, stock: 0, game: 0, ai: 0 }
            };

            feedbacks.forEach((f: any) => {
                // NPS
                const npsVal = f.answers?.nps;
                if (newMetrics.nps[npsVal as keyof typeof newMetrics.nps] !== undefined) {
                    newMetrics.nps[npsVal as keyof typeof newMetrics.nps]++;
                }

                // Bugs
                if (f.answers?.stability === 'crashed') newMetrics.bugs++;

                // Usability
                const useVal = f.answers?.usability;
                if (newMetrics.usability[useVal as keyof typeof newMetrics.usability] !== undefined) {
                    newMetrics.usability[useVal as keyof typeof newMetrics.usability]++;
                }

                // Features
                const featVal = f.answers?.favorite;
                if (newMetrics.features[featVal as keyof typeof newMetrics.features] !== undefined) {
                    newMetrics.features[featVal as keyof typeof newMetrics.features]++;
                }
            });

            setMetrics(newMetrics);
        }
    }, [feedbacks]);

    // Dados para Gráficos
    const featureData = [
        { name: 'Alarmes', value: metrics.features.alarms },
        { name: 'Estoque', value: metrics.features.stock },
        { name: 'Game', value: metrics.features.game },
        { name: 'IA Clara', value: metrics.features.ai },
    ];

    const npsData = [
        { name: 'Promotores', value: metrics.nps.promoter, color: '#22c55e' },
        { name: 'Neutros', value: metrics.nps.neutral, color: '#eab308' },
        { name: 'Detratores', value: metrics.nps.detractor, color: '#ef4444' },
    ];

    if (loading) return <div className="p-8">Carregando dados...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Feedback Dashboard</h1>
                    <p className="text-slate-500">Análise em tempo real do Beta Game</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Feedbacks</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{metrics.total}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Bugs Reportados</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2 text-red-500">
                            <Bug className="w-5 h-5" /> {metrics.bugs}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">NPS Score (Est.)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {metrics.total > 0
                                ? Math.round(((metrics.nps.promoter - metrics.nps.detractor) / metrics.total) * 100)
                                : 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Adesão Game</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{metrics.features.game} votos</div></CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Feature Favorita */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Feature Favorita</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={featureData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* NPS Breakdown */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Sentimento (NPS)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={npsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {npsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Comentários Recentes */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-500" />
                    Últimos Comentários
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {feedbacks?.slice(0, 20).map((f: any, i: number) => (
                        f.comment && (
                            <div key={i} className="p-4 bg-slate-100/50 rounded-lg border border-slate-200">
                                <p className="text-slate-800 text-sm italic">"{f.comment}"</p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                                    <span>{f.timestamp?.toDate ? f.timestamp.toDate().toLocaleDateString() : 'Recentemente'}</span>
                                    <span>•</span>
                                    <span className="uppercase font-bold">{f.campaign}</span>
                                </div>
                            </div>
                        )
                    ))}
                    {(!feedbacks || feedbacks.length === 0) && (
                        <p className="text-center text-slate-400 py-8">Nenhum feedback recebido ainda.</p>
                    )}
                </div>
            </Card>
        </div>
    );
}
