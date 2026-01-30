import { useNavigate } from "react-router-dom";
import {
    Plane, Activity, FileText, QrCode, Pill,
    Thermometer, Stethoscope, Microscope
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ToolsGrid() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const tools = [
        {
            icon: Activity,
            label: t('profile.vitalSigns'),
            path: '/sinais-vitais',
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            gradient: "from-blue-500/20 to-cyan-500/5"
        },
        {
            icon: Plane,
            label: t('more.travelMode'),
            path: '/viagem',
            color: "text-sky-500",
            bg: "bg-sky-500/10",
            gradient: "from-sky-500/20 to-blue-500/5"
        },
        {
            icon: Activity, // Diary icon replacement if strictly needed, but Activity works
            label: t('tools.diary'),
            path: '/diario-efeitos',
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            gradient: "from-rose-500/20 to-pink-500/5"
        },
        {
            icon: FileText,
            label: t('tools.docs'), // Shortened for grid
            path: '/relatorios',
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            gradient: "from-indigo-500/20 to-purple-500/5"
        },
        {
            icon: QrCode,
            label: t('tools.scan'),
            path: '/digitalizar',
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            gradient: "from-emerald-500/20 to-green-500/5"
        },
        {
            icon: Pill, // Placeholder for "More" or another tool
            label: t('tools.meds'),
            path: '/medicamentos',
            color: "text-primary",
            bg: "bg-primary/10",
            gradient: "from-primary/20 to-primary/5"
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-2">
            {tools.map((tool, index) => (
                <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(tool.path)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl aspect-[1/0.85]",
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

                    <div className={cn("p-1.5 rounded-lg z-10 transition-transform group-hover:scale-110", tool.bg)}>
                        <tool.icon className={cn("h-4 w-4", tool.color)} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground z-10 group-hover:text-foreground transition-colors leading-tight text-center">
                        {tool.label}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}
