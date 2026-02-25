import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    FileText,
    Pill,
    TestTube2,
    Syringe,
    Calendar,
    ArrowRight,
    Upload,
    FolderOpen,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OceanBackground from "@/components/ui/OceanBackground";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import { useDocumentos, HealthDocument } from "@/hooks/useCofre";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { safeDateParse } from "@/lib/safeDateUtils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CATEGORIES = [
    { value: "all", label: "Todos", icon: FolderOpen, color: "text-primary", bg: "bg-primary/10", activeBg: "bg-primary text-white" },
    { value: "receita", label: "Receitas", icon: Pill, color: "text-blue-500", bg: "bg-blue-500/10", activeBg: "bg-blue-500 text-white" },
    { value: "exame", label: "Exames", icon: TestTube2, color: "text-emerald-500", bg: "bg-emerald-500/10", activeBg: "bg-emerald-500 text-white" },
    { value: "vacinacao", label: "Vacinas", icon: Syringe, color: "text-amber-500", bg: "bg-amber-500/10", activeBg: "bg-amber-500 text-white" },
    { value: "consulta", label: "Consultas", icon: Calendar, color: "text-rose-500", bg: "bg-rose-500/10", activeBg: "bg-rose-500 text-white" },
];

function getCategoryMeta(slug?: string) {
    const map: Record<string, { icon: typeof Pill; color: string; bg: string; label: string }> = {
        receita: { icon: Pill, label: "Receita", color: "text-blue-500", bg: "bg-blue-500/10" },
        exame: { icon: TestTube2, label: "Exame", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        vacinacao: { icon: Syringe, label: "Vacina", color: "text-amber-500", bg: "bg-amber-500/10" },
        consulta: { icon: Calendar, label: "Consulta", color: "text-rose-500", bg: "bg-rose-500/10" },
    };
    return map[slug || ""] || { icon: FileText, label: "Documento", color: "text-muted-foreground", bg: "bg-muted/30" };
}

export default function Cofre() {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const dateLocale = language === "pt" ? ptBR : enUS;
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const { data: documents, isLoading } = useDocumentos({ q: searchTerm });

    const filteredDocuments = documents?.filter((doc) => {
        if (activeTab === "all") return true;
        return doc.categorySlug === activeTab;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
        <div className="min-h-screen bg-background relative">
            <OceanBackground variant="page" />
            <Header />

            <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5 page-container relative z-10">
                {/* Hero Header */}
                <PageHeroHeader
                    icon={<ShieldCheck className="h-6 w-6 text-primary" />}
                    title={t("wallet.title") || "Carteira de Saúde"}
                    subtitle={t("wallet.subtitle") || "Seus documentos médicos em um só lugar"}
                    action={{
                        label: t("common.add") || "Adicionar",
                        icon: <Plus className="h-5 w-5" />,
                        onClick: () => navigate("/carteira/upload"),
                    }}
                />

                {/* Floating Search */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={(t("common.search") || "Buscar") + " documentos..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn(
                                "pl-10 h-12 rounded-2xl",
                                "bg-card/80 backdrop-blur-xl border-border/30",
                                "shadow-[var(--shadow-glass)] focus:shadow-[var(--shadow-glass-hover)]",
                                "transition-shadow"
                            )}
                        />
                    </div>
                </motion.div>

                {/* Quick Category Icons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = activeTab === cat.value;
                        return (
                            <motion.button
                                key={cat.value}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab(cat.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap",
                                    "transition-all duration-200 border",
                                    isActive
                                        ? cn(cat.activeBg, "border-transparent shadow-lg")
                                        : "bg-card/60 backdrop-blur-sm border-border/30 text-foreground hover:bg-card/80"
                                )}
                            >
                                <cat.icon className={cn("h-4 w-4", isActive ? "text-inherit" : cat.color)} />
                                {cat.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Document List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="rounded-3xl border-border/30 bg-card/60 backdrop-blur-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-2xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !filteredDocuments || filteredDocuments.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="rounded-3xl border-border/30 bg-card/60 backdrop-blur-xl shadow-[var(--shadow-glass)]">
                            <CardContent className="py-16 text-center">
                                <div className="bg-primary/10 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-5">
                                    <FileText className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">
                                    {searchTerm ? t("common.none") || "Nenhum resultado" : t("wallet.noDocuments") || "Nenhum documento"}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                    {searchTerm
                                        ? "Tente buscar por outro termo"
                                        : "Adicione receitas, exames e vacinas para organizar sua saúde"}
                                </p>
                                {!searchTerm && (
                                    <div className="flex gap-3 justify-center">
                                        <Button className="rounded-2xl gap-2" onClick={() => navigate("/carteira/upload")}>
                                            <Upload className="h-4 w-4" /> Digitalizar
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl gap-2 border-border/30"
                                            onClick={() => navigate("/carteira/criar")}>
                                            <Plus className="h-4 w-4" /> Manual
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                        {filteredDocuments.map((doc) => {
                            const meta = getCategoryMeta(doc.categorySlug);
                            const IconComponent = meta.icon;
                            return (
                                <motion.div key={doc.id} variants={itemVariants}>
                                    <Card
                                        className={cn(
                                            "rounded-3xl border border-border/30 shadow-[var(--shadow-glass)]",
                                            "bg-card/80 backdrop-blur-xl cursor-pointer",
                                            "hover:shadow-[var(--shadow-glass-hover)] hover:scale-[1.01] active:scale-[0.99]",
                                            "transition-all duration-200"
                                        )}
                                        onClick={() => navigate(`/carteira/${doc.id}`)}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            {/* Icon */}
                                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", meta.bg)}>
                                                <IconComponent className={cn("h-6 w-6", meta.color)} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold truncate text-sm">
                                                    {doc.title || t("wallet.documents") || "Documento"}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] h-5 px-2 font-medium rounded-full bg-muted/50"
                                                    >
                                                        {meta.label}
                                                    </Badge>
                                                    {doc.provider && (
                                                        <span className="text-[11px] text-muted-foreground truncate">
                                                            {doc.provider}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date + Arrow */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {doc.createdAt && (
                                                    <span className="text-[11px] text-muted-foreground font-medium">
                                                        {format(safeDateParse(doc.createdAt), "dd MMM", { locale: dateLocale })}
                                                    </span>
                                                )}
                                                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Mobile FAB */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="fixed bottom-24 right-4 z-20 sm:hidden"
                >
                    <Button
                        size="lg"
                        className="h-14 w-14 rounded-2xl shadow-2xl"
                        onClick={() => navigate("/carteira/upload")}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </main>

            <Navigation />
        </div>
    );
}
