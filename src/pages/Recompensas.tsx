import { RewardsDashboard } from '@/components/rewards/RewardsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift } from "@phosphor-icons/react";
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';

export default function Recompensas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-indigo-500/3 to-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-3 max-w-2xl mx-auto px-4 py-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Recompensas & Séries</h1>
              <p className="text-xs text-muted-foreground">Seu programa de benefícios</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="container max-w-2xl mx-auto p-4 space-y-6"
      >
        <RewardsDashboard />
      </motion.main>

      <Navigation />
    </div>
  );
}
