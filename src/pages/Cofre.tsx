import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IconPlus,
    IconSearch,
    IconFile as FileText,
    IconMedications as Pill,
    IconHistory as Calendar,
    IconChevronRight as ArrowRight,
    IconUpload,
    IconPlans as FolderOpen,
    IconShield as ShieldCheck,
    IconTestTube,
    IconSyringe,
} from "@/components/icons/HoramedIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OceanBackground from "@/components/ui/OceanBackground";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import AdSupportCard from "@/components/AdSupportCard";
import GoogleAd from "@/components/GoogleAd";
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
    { value: "exame", label: "Exames", icon: IconTestTube, color: "text-emerald-500", bg: "bg-emerald-500/10", activeBg: "bg-emerald-500 text-white" },
    { value: "vacinacao", label: "Vacinas", icon: IconSyringe, color: "text-amber-500", bg: "bg-amber-500/10", activeBg: "bg-amber-500 text-white" },
    { value: "consulta", label: "Consultas", icon: Calendar, color: "text-rose-500", bg: "bg-rose-500/10", activeBg: "bg-rose-500 text-white" },
];

function getCategoryMeta(slug?: string) {
    const map: Record<string, { icon: any; color: string; bg: string; label: string }> = {
        receita: { icon: Pill, label: "Receita", color: "text-blue-500", bg: "bg-blue-500/10" },
        exame: { icon: IconTestTube, label: "Exame", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        vacinacao: { icon: IconSyringe, label: "Vacina", color: "text-amber-500", bg: "bg-amber-500/10" },
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
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            <OceanBackground variant="page" />
            <Header />

            <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
                {/* Hero Header */}
                <PageHeroHeader
                    icon={<ShieldCheck className="h-6 w-6 text-primary" />}
                    title={t("wallet.title") || "Carteira de Saúde"}
                    subtitle={t("wallet.subtitle") || "Seus documentos médicos em um só lugar"}
                    badge="Wallet"
                    action={{
                        label: t("common.add") || "Adicionar",
                        icon: <IconPlus className="h-5 w-5" />,
                        onClick: () => navigate("/carteira/upload"),
                    }}
                />

                {/* Floating Search */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="relative group">
                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder={(t("common.search") || "Buscar") + " documentos..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn(
                                "pl-11 h-14 rounded-3xl",
                                "bg-card/40 backdrop-blur-xl border-border/30",
                                "shadow-glass focus:shadow-glass-hover focus-visible:ring-primary/20",
                                "transition-all duration-300"
                            )}
                        />
                    </div>
                </motion.div>

                {/* Quick Category Icons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 px-1"
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = activeTab === cat.value;
                        const CategoryIcon = cat.icon;
                        return (
                            <motion.button
                                key={cat.value}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab(cat.value)}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[13px] font-bold whitespace-nowrap",
                                    "transition-all duration-300 border shadow-glass",
                                    isActive
                                        ? "bg-primary text-white border-transparent shadow-glow"
                                        : "bg-card/30 backdrop-blur-xl border-border/20 text-foreground/80 hover:bg-card/50 hover:border-border/40"
                                )}
                            >
                                <CategoryIcon className={cn("h-4.5 w-4.5", isActive ? "text-inherit" : cat.color)} />
                                {cat.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                <AdSupportCard />
                <GoogleAd placement="wallet_feed" />

                {/* Document List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="rounded-3xl border-0 bg-card/40 backdrop-blur-xl">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Skeleton className="h-14 w-14 rounded-2xl" />
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
                        <Card className="rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass">
                            <CardContent className="py-16 text-center space-y-5 px-6">
                                {/* Animated icon */}
                                <motion.div
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="bg-primary/10 rounded-[2rem] w-20 h-20 flex items-center justify-center mx-auto shadow-inner-light"
                                >
                                    {searchTerm
                                        ? <IconSearch className="h-10 w-10 text-primary/70" />
                                        : activeTab !== "all"
                                            ? <FileText className="h-10 w-10 text-primary/70" />
                                            : <ShieldCheck className="h-10 w-10 text-primary" />
                                    }
                                </motion.div>

                                {/* Headline */}
                                <div className="space-y-1.5">
                                    <h3 className="text-lg font-bold text-foreground">
                                        {searchTerm
                                            ? (language === "pt" ? "Nenhum resultado" : "No results found")
                                            : activeTab !== "all"
                                                ? (language === "pt" ? `Nenhum${activeTab === "exame" ? " exame" : activeTab === "receita" ? "a receita" : activeTab === "vacinacao" ? "a vacina" : "a consulta"} ainda` : `No ${activeTab}s yet`)
                                                : (language === "pt" ? "Sua carteira está vazia" : "Your wallet is empty")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                                        {searchTerm
                                            ? (language === "pt" ? "Tente outro termo ou limpe os filtros." : "Try a different term or clear filters.")
                                            : (language === "pt"
                                                ? "Guarde receitas, exames e vacinas em um só lugar — seguro e sempre à mão."
                                                : "Store prescriptions, exams and vaccines in one place — safe and always accessible.")}
                                    </p>
                                </div>

                                {/* Security badge */}
                                {!searchTerm && (
                                    <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 bg-muted/30 px-3 py-1.5 rounded-full">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        {language === "pt" ? "Criptografado e privado" : "Encrypted and private"}
                                    </div>
                                )}

                                {/* CTAs */}
                                {!searchTerm ? (
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto pt-1">
                                        <Button className="rounded-2xl h-12 gap-2 flex-1 shadow-glow" onClick={() => navigate("/carteira/upload")}>
                                            <IconUpload className="h-5 w-5" />
                                            {language === "pt" ? "Digitalizar" : "Scan"}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl h-12 gap-2 flex-1"
                                            onClick={() => navigate("/carteira/criar-manual")}>
                                            <IconPlus className="h-5 w-5" />
                                            {language === "pt" ? "Manual" : "Manual"}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="ghost" className="rounded-2xl gap-2" onClick={() => setSearchTerm("")}>
                                        {language === "pt" ? "Limpar busca" : "Clear search"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3.5">
                        {filteredDocuments.map((doc) => {
                            const meta = getCategoryMeta(doc.categorySlug);
                            const IconComponent = meta.icon;
                            return (
                                <motion.div key={doc.id} variants={itemVariants}>
                                    <div
                                        className="card-interactive overflow-hidden cursor-pointer"
                                        onClick={() => navigate(`/carteira/${doc.id}`)}
                                    >
                                        <div className="p-4 flex items-center gap-4">
                                            {/* Icon */}
                                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-glass-hover bg-white/5", meta.bg)}>
                                                <IconComponent className={cn("h-7 w-7", meta.color)} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold truncate text-base text-foreground/90">
                                                    {doc.title || t("wallet.documents") || "Documento"}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground/70 font-semibold uppercase tracking-wider">
                                                    <span className={cn("px-2 py-0.5 rounded-md bg-white/5", meta.color)}>
                                                        {meta.label}
                                                    </span>
                                                    {doc.provider && (
                                                        <span className="truncate">
                                                            • {doc.provider}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date + Arrow */}
                                            <div className="flex flex-col items-end gap-1.5 shrink-0 pr-1">
                                                {doc.createdAt && (
                                                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase italic tracking-widest">
                                                        {format(safeDateParse(doc.createdAt), "dd MMM", { locale: dateLocale })}
                                                    </span>
                                                )}
                                                <div className="h-7 w-7 rounded-full bg-muted/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* FAB - Upload button, always visible above nav */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-28 right-4 z-30"
                >
                    <Button
                        size="lg"
                        className="h-14 pl-4 pr-5 gap-2 rounded-2xl shadow-lg shadow-primary/25 active:scale-95 transition-all duration-200 bg-primary hover:bg-primary/90"
                        onClick={() => navigate("/carteira/upload")}
                    >
                        <IconPlus className="h-5 w-5" />
                        <span className="text-sm font-bold">{t("common.add") || "Adicionar"}</span>
                    </Button>
                </motion.div>
            </main>

            <Navigation />
        </div>
    );
}
