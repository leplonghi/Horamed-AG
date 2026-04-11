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
    IconProviders,
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
import { useDocumentos } from "@/hooks/useCofre";
import { useProviders } from "@/hooks/useProviders";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ProviderFormModal } from "@/components/providers/ProviderFormModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { safeDateParse } from "@/lib/safeDateUtils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
    { value: "all", label: "Todos", icon: FolderOpen, color: "text-primary", bg: "bg-primary/10", activeBg: "bg-primary text-white" },
    { value: "receita", label: "Receitas", icon: Pill, color: "text-blue-500", bg: "bg-blue-500/10", activeBg: "bg-blue-500 text-white" },
    { value: "exame", label: "Exames", icon: IconTestTube, color: "text-emerald-500", bg: "bg-emerald-500/10", activeBg: "bg-emerald-500 text-white" },
    { value: "vacinacao", label: "Vacinas", icon: IconSyringe, color: "text-amber-500", bg: "bg-amber-500/10", activeBg: "bg-amber-500 text-white" },
    { value: "consulta", label: "Consultas", icon: Calendar, color: "text-rose-500", bg: "bg-rose-500/10", activeBg: "bg-rose-500 text-white" },
    { value: "locais", label: "Locais", icon: IconProviders, color: "text-purple-500", bg: "bg-purple-500/10", activeBg: "bg-purple-500 text-white" },
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
    const { providers, add: addProvider, update: updateProvider, remove: removeProvider, toggleFavorite } = useProviders();
    const [providerModalOpen, setProviderModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);

    const filteredDocuments = documents?.filter((doc) => {
        if (activeTab === "all") return true;
        if (activeTab === "locais") return false;
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
                    title={activeTab === "locais" ? "Meus Locais" : (t("wallet.title") || "Carteira de Saúde")}
                    subtitle={activeTab === "locais" ? "Especialistas, consultórios e hospitais de confiança" : (t("wallet.subtitle") || "Seus documentos médicos em um só lugar")}
                    badge="Wallet"
                    action={activeTab === "locais" ? {
                        label: language === "pt" ? "Novo Local" : "New Place",
                        icon: <IconPlus className="h-5 w-5" />,
                        onClick: () => { setEditingProvider(null); setProviderModalOpen(true); }
                    } : {
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
                            placeholder={(t("common.search") || "Buscar") + (activeTab === 'locais' ? " nos meus locais..." : " documentos...")}
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

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
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
                        </motion.div>
                    ) : activeTab === "locais" ? (
                        <motion.div 
                            key="locais"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show" 
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                                    providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((provider) => (
                                        <motion.div key={provider.id} variants={itemVariants}>
                                            <ProviderCard 
                                                provider={provider} 
                                                onEdit={(p) => { setEditingProvider(p); setProviderModalOpen(true); }}
                                                onDelete={removeProvider}
                                                onToggleFavorite={toggleFavorite}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <Card className="col-span-full rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl p-12 flex flex-col items-center text-center">
                                        <div className="h-20 w-20 rounded-[2rem] bg-muted/40 flex items-center justify-center text-muted-foreground mb-6 shadow-inner-light">
                                            <IconProviders className="h-10 w-10 opacity-20" />
                                        </div>
                                        <h3 className="font-bold text-xl text-foreground/70 mb-2">
                                            {searchTerm ? "Nenhum local encontrado" : "Nenhum local salvo ainda"}
                                        </h3>
                                        <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                                            {searchTerm ? "Tente buscar por outro termo." : "Salve seus hospitais, farmácias e médicos favoritos para acesso rápido."}
                                        </p>
                                        {!searchTerm && (
                                            <Button 
                                                onClick={() => { setEditingProvider(null); setProviderModalOpen(true); }}
                                                className="h-12 rounded-2xl px-6 bg-primary font-bold shadow-glow"
                                            >
                                                Adicionar Primeiro Local
                                            </Button>
                                        )}
                                    </Card>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="documents"
                            variants={containerVariants} 
                            initial="hidden" 
                            animate="show" 
                            className="space-y-4"
                        >
                            {/* Special case: show Locais preview in 'all' tab if we have any */}
                            {activeTab === "all" && providers.length > 0 && !searchTerm && (
                                <motion.div variants={itemVariants}>
                                    <div 
                                        className="rounded-[2rem] bg-purple-500/10 border border-purple-500/20 p-4 flex items-center gap-4 cursor-pointer hover:bg-purple-500/15 transition-all shadow-glass"
                                        onClick={() => setActiveTab("locais")}
                                    >
                                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 bg-purple-500 text-white shadow-glow">
                                            <IconProviders className="h-7 w-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-base">Meus Locais de Saúde</h4>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {providers.length} local{providers.length > 1 ? 'is' : ''} registrado{providers.length > 1 ? 's' : ''} na sua rede.
                                            </p>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                                            <ArrowRight className="h-5 w-5 text-purple-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {filteredDocuments && filteredDocuments.length > 0 ? (
                                filteredDocuments.map((doc) => (
                                    <motion.div key={doc.id} variants={itemVariants}>
                                        <Card
                                            onClick={() => navigate(`/carteira/${doc.id}`)}
                                            className="rounded-[2rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass hover:shadow-glass-hover hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden group"
                                        >
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div
                                                    className={cn(
                                                        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner-light shrink-0 transition-transform duration-300 group-hover:scale-110",
                                                        getCategoryMeta(doc.categorySlug).bg,
                                                        getCategoryMeta(doc.categorySlug).color
                                                    )}
                                                >
                                                    {(() => {
                                                        const Icon = getCategoryMeta(doc.categorySlug).icon;
                                                        return <Icon className="h-7 w-7" />;
                                                    })()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-lg text-foreground/90 truncate">
                                                            {doc.title}
                                                        </h3>
                                                        {doc.status === "finalizado" && (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-5 px-1.5 rounded-md text-[10px] font-black uppercase">
                                                                Finalizado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground/60 font-medium">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 opacity-50" />
                                                            {safeDateParse(doc.date)
                                                                ? format(safeDateParse(doc.date)!, "dd MMM, yyyy", {
                                                                      locale: dateLocale,
                                                                  })
                                                                : "Sem data"}
                                                        </span>
                                                        <span className="h-1 w-1 rounded-full bg-border" />
                                                        <span className="truncate">
                                                            {doc.providerName || "Documento Geral"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <Card className="rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl p-12 flex flex-col items-center text-center">
                                    <div className="h-20 w-20 rounded-[2rem] bg-muted/40 flex items-center justify-center text-muted-foreground mb-6 shadow-inner-light">
                                        <IconSearch className="h-10 w-10 opacity-20" />
                                    </div>
                                    <h3 className="font-bold text-xl text-foreground/70 mb-2">
                                        {searchTerm ? "Nenhum resultado" : "Sua carteira está vazia"}
                                    </h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                                        {searchTerm
                                            ? "Tente buscar por termos diferentes ou verifique a categoria."
                                            : "Comece adicionando seus primeiros documentos médicos para manter seu histórico organizado."}
                                    </p>
                                    {!searchTerm && (
                                        <Button 
                                            onClick={() => navigate("/carteira/upload")}
                                            className="h-12 rounded-2xl px-6 bg-primary font-bold shadow-glow"
                                        >
                                            Digitalizar Primeiro Documento
                                        </Button>
                                    )}
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <GoogleAd placement="bottom" />
                <AdSupportCard />
            </main>

            {/* Floating Action Button */}
            {!providerModalOpen && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed bottom-28 right-4 z-40"
                >
                    <Button
                        size="lg"
                        className="h-14 pl-4 pr-5 gap-2 rounded-2xl shadow-glow active:scale-95 transition-all bg-primary hover:bg-primary/90 text-white"
                        onClick={() => {
                            if (activeTab === 'locais') {
                                setEditingProvider(null);
                                setProviderModalOpen(true);
                            } else {
                                navigate("/carteira/upload");
                            }
                        }}
                    >
                        <IconPlus className="h-6 w-6" />
                        <span className="font-bold">{activeTab === 'locais' ? "Novo Local" : (t("common.add") || "Adicionar")}</span>
                    </Button>
                </motion.div>
            )}

            {/* Modals */}
            <ProviderFormModal 
                open={providerModalOpen}
                onClose={() => { setProviderModalOpen(false); setEditingProvider(null); }}
                onCreate={addProvider}
                onUpdate={updateProvider}
                editing={editingProvider}
            />

            <Navigation activePath="/carteira" />
        </div>
    );
}
