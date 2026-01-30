import { Search, Pill, Sparkles } from "lucide-react";
import { EmptyStatePro } from "@/components/ui/EmptyStatePro";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";
import { MedicationItemCard, MedicationItem } from "./MedicationItemCard";
import UsageLimitWarning from "@/components/fomo/UsageLimitWarning";
import PremiumTeaser from "@/components/fomo/PremiumTeaser";
import { AffiliateCard } from "@/components/fitness/AffiliateCard";
import { dismissRecommendation, AffiliateProduct } from "@/lib/affiliateEngine";

interface RoutineTabProps {
    items: MedicationItem[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string, name: string) => void;
    showAffiliateCard: boolean;
    setShowAffiliateCard: (show: boolean) => void;
    affiliateProduct: AffiliateProduct | null;
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
    showAffiliateCard,
    setShowAffiliateCard,
    affiliateProduct,
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
        <div className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {/* Search - Compact */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t('common.search') + "..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-full border focus:border-primary transition-all h-10"
                />
            </div>

            {/* Category Tabs - Compact single line */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-8 gap-0.5 p-0.5 rounded-lg bg-muted/50">
                    <TabsTrigger
                        value="todos"
                        className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1.5 py-1 text-[11px] transition-all"
                    >
                        <Pill className="h-3 w-3 mr-0.5" />
                        ({items.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="medicamento"
                        className="rounded-md px-1.5 py-1 text-[11px] transition-all"
                    >
                        💊 ({getCategoryCount("medicamento")})
                    </TabsTrigger>
                    <TabsTrigger
                        value="vitamina"
                        className="rounded-md px-1.5 py-1 text-[11px] transition-all"
                    >
                        ❤️ ({getCategoryCount("vitamina")})
                    </TabsTrigger>
                    <TabsTrigger
                        value="suplemento"
                        className="rounded-md px-1.5 py-1 text-[11px] transition-all"
                    >
                        ⚡ ({getCategoryCount("suplemento")})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-2 sm:space-y-4 mt-3 sm:mt-6">
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
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                        >
                            {filteredItems.filter(item => item.category === 'medicamento').length > 0 && (
                                <div className="space-y-1.5 sm:space-y-3">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                        <Pill className="h-3.5 w-3.5" />
                                        Medicamentos
                                    </h3>
                                    {filteredItems
                                        .filter(item => item.category === 'medicamento')
                                        .map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                variants={{
                                                    hidden: { opacity: 0, y: 20 },
                                                    show: { opacity: 1, y: 0 }
                                                }}
                                            >
                                                <MedicationItemCard
                                                    item={item}
                                                    index={index}
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                />
                                            </motion.div>
                                        ))}
                                </div>
                            )}

                            {filteredItems.filter(item => item.category === 'vitamina' || item.category === 'suplemento').length > 0 && (
                                <div className="space-y-1.5 sm:space-y-3 mt-3 sm:mt-6">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Suplementos & Vitaminas
                                    </h3>
                                    {filteredItems
                                        .filter(item => item.category === 'vitamina' || item.category === 'suplemento')
                                        .map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                variants={{
                                                    hidden: { opacity: 0, y: 20 },
                                                    show: { opacity: 1, y: 0 }
                                                }}
                                            >
                                                <MedicationItemCard
                                                    item={item}
                                                    index={index}
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                />
                                            </motion.div>
                                        ))}
                                </div>
                            )}

                            {filteredItems.filter(item => item.category === 'outro').length > 0 && (
                                <div className="space-y-1.5 sm:space-y-3 mt-3 sm:mt-6">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                        Outros
                                    </h3>
                                    {filteredItems
                                        .filter(item => item.category === 'outro')
                                        .map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                variants={{
                                                    hidden: { opacity: 0, y: 20 },
                                                    show: { opacity: 1, y: 0 }
                                                }}
                                            >
                                                <MedicationItemCard
                                                    item={item}
                                                    index={index}
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                />
                                            </motion.div>
                                        ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>

            {/* FOMO: Usage limit warning */}
            <UsageLimitWarning
                current={items.length}
                max={1}
                type="medications"
                className="mt-4"
            />

            {showAffiliateCard && affiliateProduct && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AffiliateCard
                        product={affiliateProduct}
                        context="MEDICATION_LIST"
                        onDismiss={() => {
                            dismissRecommendation("MEDICATION_LIST");
                            setShowAffiliateCard(false);
                        }}
                    />
                </motion.div>
            )}

            {/* FOMO: Premium teaser for reports */}
            <PremiumTeaser feature="reports" compact className="mt-4" />
        </div>
    );
}
