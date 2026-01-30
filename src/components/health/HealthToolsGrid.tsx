import { useNavigate } from "react-router-dom";
import { Activity, FileText, QrCode, BookOpen } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function HealthToolsGrid() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const tools = [
        {
            icon: Activity,
            label: t('profile.vitalSigns'),
            description: t('profile.trackYourWeightDesc'),
            path: '/sinais-vitais',
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            gradient: "from-blue-500/20 to-cyan-500/5"
        },
        {
            icon: BookOpen,
            label: t('tools.diary'),
            description: "Registre sintomas e efeitos",
            path: '/diario-efeitos',
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            gradient: "from-rose-500/20 to-pink-500/5"
        },
        {
            icon: FileText,
            label: t('tools.docs'),
            description: "Gere relatórios médicos",
            path: '/relatorios',
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            gradient: "from-indigo-500/20 to-purple-500/5"
        },
        {
            icon: QrCode,
            label: t('tools.scan'),
            description: "Digitalize documentos",
            path: '/digitalizar',
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            gradient: "from-emerald-500/20 to-green-500/5"
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tools.map((tool, index) => (
                <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(tool.path)}
                    className={cn(
                        "flex flex-col items-start gap-2 p-3 rounded-xl text-left",
                        "bg-card/50 backdrop-blur-sm border border-border/30 hover:bg-card/80 transition-all",
                        "shadow-sm",
                        "relative overflow-hidden group"
                    )}
                >
                    {/* Subtle gradient background on hover */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        tool.gradient
                    )} />

                    <div className={cn("p-2 rounded-lg z-10 transition-transform group-hover:scale-110", tool.bg)}>
                        <tool.icon className={cn("h-5 w-5", tool.color)} />
                    </div>

                    <div className="z-10 space-y-0.5">
                        <span className="text-sm font-semibold text-foreground block">
                            {tool.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight block">
                            {tool.description}
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
