import { motion } from "framer-motion";
import { CheckCircle, X, Trophy, Waves } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ConfettiExplosion from "./ConfettiExplosion";
import StreakAnimation from "./StreakAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streak: number;
  milestone?: { days: number; badge: string; reward: string };
}

export default function DailyCompleteModal({
  open,
  onOpenChange,
  streak,
  milestone,
}: Props) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none p-0 overflow-visible">
        <ConfettiExplosion trigger={open} />
        
        <motion.div 
          className="relative bg-gradient-to-br from-blue-600/90 via-blue-500/80 to-teal-400/90 backdrop-blur-xl rounded-[2.5rem] p-8 overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          {/* Animated Background Waves */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <motion.div
              className="absolute -bottom-1/2 -left-1/2 w-[200%] h-[200%] bg-white/20 rounded-[40%] mix-blend-overlay"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -bottom-1/2 -left-3/4 w-[200%] h-[200%] bg-blue-200/20 rounded-[45%] mix-blend-overlay"
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="absolute top-6 right-6 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <div className="relative">
                <div className="p-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <CheckCircle className="h-20 w-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" weight="duotone" />
                </div>
                {/* Ring of Light */}
                <motion.div 
                   className="absolute inset-0 rounded-full border-2 border-white/30"
                   animate={{ scale: [1, 1.4], opacity: [1, 0] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <div className="space-y-3">
              <motion.h2
                className="text-4xl font-black text-white tracking-tight drop-shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t('dailyComplete.congrats')}
              </motion.h2>
              <motion.p
                className="text-blue-50/80 font-medium px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {t('dailyComplete.completedAll')}
              </motion.p>
            </div>

            <motion.div
              className="w-full py-6 px-4 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="relative">
                <StreakAnimation streak={streak} />
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-white">{streak}</p>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-100/60 ">{t('dailyComplete.days')}</p>
                <p className="text-xs text-blue-100/40 mt-1 max-w-[200px]">{t('dailyComplete.commitment')}</p>
              </div>
            </motion.div>

            {milestone && (
              <motion.div
                className="p-5 rounded-2xl bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-white/10 w-full flex items-center gap-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="p-3 rounded-xl bg-amber-400/30">
                  <Trophy className="h-8 w-8 text-amber-300" weight="duotone" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-amber-50">
                    {milestone.badge}
                  </p>
                  <p className="text-sm font-medium text-amber-100/60 leading-tight">
                    {milestone.reward}
                  </p>
                </div>
              </motion.div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-white text-blue-600 hover:bg-white/90 text-lg font-black shadow-xl transition-all active:scale-[0.98]"
              onClick={() => onOpenChange(false)}
            >
              {t('dailyComplete.continue')}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}