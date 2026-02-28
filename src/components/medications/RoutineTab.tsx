import { Search, Pill, Sparkles, Leaf, Heart, Package } from "lucide-react";
import { EmptyStatePro } from "@/components/ui/EmptyStatePro";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
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
                                className="space-y-8"
                            >
                                {/* Summary Badges - Quick overview */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {getCategoryCount("medicamento") > 0 && (
                                        <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200 shadow-sm">
                                            {getCategoryCount("medicamento")} Medicamentos
                                        </div>
                                    )}
                                    {getCategoryCount("vitamina") > 0 && (
                                        <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200 shadow-sm">
                                            {getCategoryCount("vitamina")} Vitaminas
                                        </div>
                                    )}
                                    {getCategoryCount("suplemento") > 0 && (
                                        <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200 shadow-sm">
                                            {getCategoryCount("suplemento")} Suplementos
                                        </div>
                                    )}
                                </div>

                                {filteredItems.filter(item => item.category === 'medicamento').length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                            <div className="p-2 rounded-lg bg-blue-500 shadow-lg shadow-blue-200">
                                                <Pill className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-bold text-blue-900 uppercase tracking-tight">
                                                    Medicamentos
                                                </h3>
                                                <p className="text-[10px] text-blue-600/70 font-medium">Tratamentos e remédios controlados</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredItems
                                                .filter(item => item.category === 'medicamento')
                                                .map((item, index) => (
                                                    <motion.div
                                                        key={item.id}
                                                        variants={{
                                                            hidden: { opacity: 0, scale: 0.95 },
                                                            show: { opacity: 1, scale: 1 }
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
                                    </div>
                                )}

                                {filteredItems.filter(item => item.category === 'vitamina').length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50/50 border border-green-100/50">
                                            <div className="p-2 rounded-lg bg-green-500 shadow-lg shadow-green-200">
                                                <Leaf className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-bold text-green-900 uppercase tracking-tight">
                                                    Vitaminas
                                                </h3>
                                                <p className="text-[10px] text-green-600/70 font-medium">Bem-estar e imunidade diária</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredItems
                                                .filter(item => item.category === 'vitamina')
                                                .map((item, index) => (
                                                    <motion.div
                                                        key={item.id}
                                                        variants={{
                                                            hidden: { opacity: 0, scale: 0.95 },
                                                            show: { opacity: 1, scale: 1 }
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
                                    </div>
                                )}

                                {filteredItems.filter(item => item.category === 'suplemento').length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50/50 border border-teal-100/50">
                                            <div className="p-2 rounded-lg bg-teal-500 shadow-lg shadow-teal-200">
                                                <Heart className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-bold text-teal-900 uppercase tracking-tight">
                                                    Suplementos
                                                </h3>
                                                <p className="text-[10px] text-teal-600/70 font-medium">Performance e nutrição esportiva</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredItems
                                                .filter(item => item.category === 'suplemento')
                                                .map((item, index) => (
                                                    <motion.div
                                                        key={item.id}
                                                        variants={{
                                                            hidden: { opacity: 0, scale: 0.95 },
                                                            show: { opacity: 1, scale: 1 }
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
                                    </div>
                                )}

                                {filteredItems.filter(item => item.category === 'outro').length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50/50 border border-gray-100/50">
                                            <div className="p-2 rounded-lg bg-gray-500 shadow-lg shadow-gray-200">
                                                <Package className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-tight">
                                                    Outros
                                                </h3>
                                                <p className="text-[10px] text-gray-600/70 font-medium">Diversos itens de cuidado</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredItems
                                                .filter(item => item.category === 'outro')
                                                .map((item, index) => (
                                                    <motion.div
                                                        key={item.id}
                                                        variants={{
                                                            hidden: { opacity: 0, scale: 0.95 },
                                                            show: { opacity: 1, scale: 1 }
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
                                    </div>
                                )}
                            </motion.div>
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

            {/* FOMO: Premium teaser for reports */}

            {/* FOMO: Premium teaser for reports */}
            <PremiumTeaser feature="reports" compact className="mt-4" />
        </div>
    );
}
