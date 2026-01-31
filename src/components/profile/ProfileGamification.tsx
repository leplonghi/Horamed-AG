import { motion } from "framer-motion";
import { Trophy, Flame, Gift, Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function ProfileGamification() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Mock data - would normally come from useRewards() or similar hook
    const stats = [
        {
            id: 'streak',
            label: "Sequência",
            value: "5 Dias",
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            borderColor: "border-orange-500/20",
            gradient: "from-orange-500/20 to-red-500/5",
            path: "/recompensas"
        },
        {
            id: 'level',
            label: "Nível",
            value: "Prata",
            icon: Star,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            borderColor: "border-yellow-500/20",
            gradient: "from-yellow-400/20 to-amber-500/5",
            path: "/recompensas"
        },
        {
            id: 'points',
            label: "Pontos",
            value: "1,250",
            icon: Trophy,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
            gradient: "from-purple-500/20 to-indigo-500/5",
            path: "/recompensas"
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, index) => (
                <motion.button
                    key={stat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(stat.path)}
                    className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-xl overflow-hidden",
                        "bg-card/40 backdrop-blur-sm border",
                        stat.borderColor
                    )}
                >
                    {/* Background Gradient */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100",
                        stat.gradient
                    )} />

                    {/* Icon */}
                    <div className={cn("p-1.5 rounded-full mb-1.5 backdrop-blur-md", stat.bg)}>
                        <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                    </div>

                    {/* Value */}
                    <span className="text-xs font-bold text-foreground relative z-10 leading-none mb-0.5">
                        {stat.value}
                    </span>

                    {/* Label */}
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider relative z-10">
                        {stat.label}
                    </span>
                </motion.button>
            ))}

            {/* Rewards Banner */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/recompensas')}
                className="col-span-3 mt-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 p-3 flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500 group-hover:scale-110 transition-transform duration-300">
                        <Gift className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xs font-bold text-foreground">{t("gamification.myRewards")}</h4>
                        <p className="text-[10px] text-muted-foreground">3 itens disponíveis para resgate</p>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-pink-500 transition-colors" />
            </motion.button>
        </div>
    );
}
