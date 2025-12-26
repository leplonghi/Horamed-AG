import { useWeightInsights } from "@/hooks/useWeightInsights";
import { Button } from "@/components/ui/button";
import { Scale, TrendingDown, TrendingUp, Minus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface TodayWeightWidgetProps {
  profileId?: string;
}

export default function TodayWeightWidget({ profileId }: TodayWeightWidgetProps) {
  const { data, isLoading } = useWeightInsights(profileId);
  const navigate = useNavigate();

  // Only show if user has GLP-1/bariatric medication
  if (isLoading || !data?.hasGLP1) {
    return null;
  }

  // Get the main correlation insight
  const correlationInsight = data.insights.find(i => i.type === 'correlation' && i.trend);
  const trendInsight = data.insights.find(i => i.type === 'trend');

  // If no meaningful insight to show, don't render
  if (!correlationInsight && !trendInsight) {
    return null;
  }

  const mainInsight = correlationInsight || trendInsight;

  const getTrendIcon = () => {
    if (mainInsight?.trend === 'down') {
      return <TrendingDown className="h-5 w-5 text-primary" />;
    } else if (mainInsight?.trend === 'up') {
      return <TrendingUp className="h-5 w-5 text-primary" />;
    }
    return <Minus className="h-5 w-5 text-primary" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div 
        className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 cursor-pointer group hover-lift"
        style={{ boxShadow: 'var(--shadow-sm)' }}
        onClick={() => navigate('/progresso')}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-xl shrink-0"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
          >
            {getTrendIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground text-sm truncate">
                {mainInsight?.title || 'Acompanhamento de peso'}
              </h4>
              {mainInsight?.value && (
                <span className="text-sm font-bold text-primary">
                  {mainInsight.value}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {data.medications?.[0]?.name && `Com ${data.medications[0].name}`}
            </p>
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
