import { RewardsDashboard } from '@/components/rewards/RewardsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Recompensas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center gap-4 max-w-md mx-auto w-full">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Recompensas & Streaks</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto p-4 space-y-6">
        <RewardsDashboard />

        {/* Espaço para mais seções: Histórico, Ranking, etc */}
        <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <p>Mantenha seus streaks para ganhar mais!</p>
        </div>
      </main>
    </div>
  );
}
