import {
    IconSearch as Search,
    IconPill as Pill,
    IconSparkles as Sparkles,
    IconHealth as Leaf,
    IconHeartPulse as Heart,
    IconArchive as Package
} from "@/components/icons/HoramedIcons";
import { EmptyStatePro } from "@/components/ui/EmptyStatePro";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";
import { MedicationItemCard, MedicationItem } from "./MedicationItemCard";
import UsageLimitWarning from "@/components/fomo/UsageLimitWarning";
import PremiumTeaser from "@/components/fomo/PremiumTeaser";

interface RoutineTabProps {
    items: MedicationItem[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string, name: string) => void;
    onAdd?: () => void;
}

export function RoutineTab({
    items,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    onEdit,
    onDelete,
    onAdd
}: RoutineTabProps) {
    const { t } = useTranslation();

    const filteredItems = items.filter((item) => {
        const matchesTab = activeTab === "todos" || item.category === activeTab;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getCategoryCount = (category: string) => {
        return items.filter(item => item.category === category).length;
    };

    return (
        <div className="space-y-6 mt-6 pb-20">
            {/* Search - Glassmorphic */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                    placeholder={t('common.search') + "..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 focus:border-primary/50 transition-all h-12 text-sm shadow-glass"
                />
            </div>

            {/* Category Tabs - Floating Style */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-12 p-1.5 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-glass gap-1">
                    <TabsTrigger
                        value="todos"
                        className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow px-2 py-1.5 text-xs transition-all font-bold"
                    >
                        TUDO
                    </TabsTrigger>
                    <TabsTrigger
                        value="medicamento"
                        className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow px-2 py-1.5 text-xs transition-all font-bold"
                    >
                        MEDS
                    </TabsTrigger>
                    <TabsTrigger
                        value="vitamina"
                        className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow px-2 py-1.5 text-xs transition-all font-bold"
                    >
                        VITS
                    </TabsTrigger>
                    <TabsTrigger
                        value="suplemento"
                        className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow px-2 py-1.5 text-xs transition-all font-bold"
                    >
                        SUPS
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6 mt-8">
                    {filteredItems.length === 0 ? (
                        <EmptyStatePro
                            title={searchTerm ? "Nenhum item encontrado" : "Seu armário está vazio"}
                            description={searchTerm
                                ? `Não encontramos nada com "${searchTerm}". Tente outro termo.`
                                : "Adicione seus medicamentos, vitaminas e suplementos para começar a monitorar sua saúde."}
                            icon={Pill}
                            actionLabel="Adicionar Agora"
                            onAction={onAdd}
                        />
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Badges */}
                            <div className="flex flex-wrap gap-2 px-1">
                                {getCategoryCount("medicamento") > 0 && (
                                    <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 backdrop-blur-md">
                                        {getCategoryCount("medicamento")} MEDICAMENTOS
                                    </div>
                                )}
                                {getCategoryCount("vitamina") > 0 && (
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 backdrop-blur-md">
                                        {getCategoryCount("vitamina")} VITAMINAS
                                    </div>
                                )}
                                {getCategoryCount("suplemento") > 0 && (
                                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 backdrop-blur-md">
                                        {getCategoryCount("suplemento")} SUPLEMENTOS
                                    </div>
                                )}
                            </div>

                            <AnimatePresence mode="popLayout">
                                {filteredItems.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        {/* Medication Group */}
                                        {filteredItems.filter(item => item.category === 'medicamento').length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 px-1 mb-4">
                                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-glow shadow-blue-500/50" />
                                                    <h3 className="text-sm font-black text-foreground/80 uppercase tracking-tighter italic">Medicamentos</h3>
                                                </div>
                                                {filteredItems
                                                    .filter(item => item.category === 'medicamento')
                                                    .map((item, index) => (
                                                        <MedicationItemCard
                                                            key={item.id}
                                                            item={item}
                                                            index={index}
                                                            onEdit={onEdit}
                                                            onDelete={onDelete}
                                                        />
                                                    ))}
                                            </div>
                                        )}

                                        {/* Vitamin Group */}
                                        {filteredItems.filter(item => item.category === 'vitamina').length > 0 && (
                                            <div className="space-y-3 mt-8">
                                                <div className="flex items-center gap-3 px-1 mb-4">
                                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-glow shadow-emerald-500/50" />
                                                    <h3 className="text-sm font-black text-foreground/80 uppercase tracking-tighter italic">Vitaminas</h3>
                                                </div>
                                                {filteredItems
                                                    .filter(item => item.category === 'vitamina')
                                                    .map((item, index) => (
                                                        <MedicationItemCard
                                                            key={item.id}
                                                            item={item}
                                                            index={index}
                                                            onEdit={onEdit}
                                                            onDelete={onDelete}
                                                        />
                                                    ))}
                                            </div>
                                        )}

                                        {/* Supplement Group */}
                                        {filteredItems.filter(item => item.category === 'suplemento').length > 0 && (
                                            <div className="space-y-3 mt-8">
                                                <div className="flex items-center gap-3 px-1 mb-4">
                                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-glow shadow-amber-500/50" />
                                                    <h3 className="text-sm font-black text-foreground/80 uppercase tracking-tighter italic">Suplementos</h3>
                                                </div>
                                                {filteredItems
                                                    .filter(item => item.category === 'suplemento')
                                                    .map((item, index) => (
                                                        <MedicationItemCard
                                                            key={item.id}
                                                            item={item}
                                                            index={index}
                                                            onEdit={onEdit}
                                                            onDelete={onDelete}
                                                        />
                                                    ))}
                                            </div>
                                        )}

                                        {/* Other Group */}
                                        {filteredItems.filter(item => item.category === 'outro').length > 0 && (
                                            <div className="space-y-3 mt-8">
                                                <div className="flex items-center gap-3 px-1 mb-4">
                                                    <div className="w-1.5 h-6 bg-gray-500 rounded-full shadow-glow shadow-gray-500/50" />
                                                    <h3 className="text-sm font-black text-foreground/80 uppercase tracking-tighter italic">Outros</h3>
                                                </div>
                                                {filteredItems
                                                    .filter(item => item.category === 'outro')
                                                    .map((item, index) => (
                                                        <MedicationItemCard
                                                            key={item.id}
                                                            item={item}
                                                            index={index}
                                                            onEdit={onEdit}
                                                            onDelete={onDelete}
                                                        />
                                                    ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* FOMO Sections */}
            <div className="mt-8 space-y-4 px-1">
                <UsageLimitWarning
                    current={items.length}
                    max={1}
                    type="medications"
                    className="rounded-[2rem] border border-white/5 overflow-hidden shadow-glass"
                />
                <PremiumTeaser feature="reports" compact className="rounded-[2.5rem] p-6" />
            </div>
        </div>
    );
}
