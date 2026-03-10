import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Crown, X, Sparkle as Sparkles, Check, Pill, Robot as Bot, Camera, ChartBar as BarChart3, Users } from "@phosphor-icons/react";

interface PremiumPaywallProps {
    isOpen: boolean;
    onClose: () => void;
    /** Context hint — why is the paywall showing? */
    trigger?: "medication_limit" | "ocr" | "charts" | "family" | "ai" | "generic";
    /** How many free items the user already has */
    usedCount?: number;
}

const TRIGGER_COPY = {
    medication_limit: {
        title: "Você usa mais de 1 medicamento?",
        subtitle: "O plano gratuito permite apenas 1 medicamento. Desbloqueie todos os seus tratamentos com o Premium.",
        icon: <Pill className="h-8 w-8 text-white" />,
        gradient: "from-blue-500 via-primary to-cyan-500",
    },
    ocr: {
        title: "Escaneie suas receitas",
        subtitle: "A leitura automática de receitas por IA está disponível no plano Premium.",
        icon: <Camera className="h-8 w-8 text-white" />,
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    charts: {
        title: "Análise completa da sua saúde",
        subtitle: "Histórico ilimitado, gráficos de evolução e relatórios médicos estão no Premium.",
        icon: <BarChart3 className="h-8 w-8 text-white" />,
        gradient: "from-teal-500 via-emerald-500 to-cyan-500",
    },
    family: {
        title: "Cuide de toda a família",
        subtitle: "Múltiplos perfis de família estão disponíveis somente no Premium.",
        icon: <Users className="h-8 w-8 text-white" />,
        gradient: "from-amber-500 via-orange-500 to-red-500",
    },
    ai: {
        title: "Clara, sua IA de saúde",
        subtitle: "Conversas ilimitadas com a Clara, sua assistente de saúde inteligente, são exclusivas do Premium.",
        icon: <Bot className="h-8 w-8 text-white" />,
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    },
    generic: {
        title: "Desbloqueie o HoraMed completo",
        subtitle: "Acesse todas as funcionalidades premium por um preço que cabe no seu bolso.",
        icon: <Crown className="h-8 w-8 text-white" />,
        gradient: "from-primary via-cyan-500 to-teal-500",
    },
};

const HIGHLIGHTS = [
    "Medicamentos ilimitados",
    "Clara IA 24h/7 dias",
    "Scanner de receitas",
    "Histórico e gráficos completos",
    "Perfis de família",
    "Sem anúncios",
];

export function PremiumPaywall({ isOpen, onClose, trigger = "generic", usedCount }: PremiumPaywallProps) {
    const navigate = useNavigate();
    const copy = TRIGGER_COPY[trigger];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="paywall-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="paywall-sheet"
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="fixed bottom-0 left-0 right-0 z-[201] rounded-t-3xl overflow-hidden"
                        style={{ maxHeight: "92dvh" }}
                    >
                        <div className="bg-card overflow-y-auto">
                            {/* Gradient Hero */}
                            <div className={`bg-gradient-to-br ${copy.gradient} px-6 pt-8 pb-10 relative`}>
                                {/* Close */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                                    aria-label="Fechar"
                                >
                                    <X size={18} />
                                </button>

                                {/* Drag handle */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/40" />

                                <div className="flex flex-col items-center text-center gap-4">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                                        className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm"
                                    >
                                        {copy.icon}
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <h2 className="text-xl font-bold text-white leading-tight">
                                            {copy.title}
                                        </h2>
                                        {usedCount !== undefined && trigger === "medication_limit" && (
                                            <p className="text-white/80 text-sm mt-1">
                                                Você já tem <strong className="text-white">{usedCount} medicamento{usedCount !== 1 ? "s" : ""}</strong> cadastrado{usedCount !== 1 ? "s" : ""}
                                            </p>
                                        )}
                                        <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">
                                            {copy.subtitle}
                                        </p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="px-6 pt-6 pb-4 -mt-4">
                                <div className="bg-background rounded-2xl shadow-lg p-5 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-semibold text-foreground">Tudo incluído no Premium:</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {HIGHLIGHTS.map((item, i) => (
                                            <motion.div
                                                key={item}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + i * 0.05 }}
                                                className="flex items-center gap-2.5"
                                            >
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-sm text-foreground">{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="px-6 pb-6 space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Button
                                        className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 shadow-lg shadow-primary/30 transition-all"
                                        onClick={() => {
                                            onClose();
                                            navigate("/planos");
                                        }}
                                    >
                                        <Crown className="h-5 w-5 mr-2" />
                                        Ver Planos Premium
                                    </Button>
                                </motion.div>

                                <p className="text-center text-xs text-muted-foreground pb-2">
                                    7 dias grátis · Cancele quando quiser · Sem cartão agora
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
