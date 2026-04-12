import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/useAchievements";
import { useXPSystem } from "@/hooks/useXPSystem";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import AchievementCard from "@/components/AchievementCard";
import XPSystem from "@/components/gamification/XPSystem";
import StreakAnimation from "@/components/celebrations/StreakAnimation";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { Achievement } from "@/hooks/useAchievements";
import { Trophy, Star, Flame, Lock } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import TutorialHint from "@/components/TutorialHint";
import { useLanguage } from "@/contexts/LanguageContext";
import { pressable } from "@/lib/a11y";
import { cn } from "@/lib/utils";

export default function Achievements({ hideLayout = false }: { hideLayout?: boolean }) {
  const { t } = useLanguage();
  const { achievements, loading: achievementsLoading, unlockedCount } = useAchievements();
  const xpSystem = useXPSystem();
  const { currentStreak, longestStreak, loading: streakLoading } = useStreakCalculator();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleShareClick = (achievement: Achievement) => {
    if (achievement.unlocked) {
      setSelectedAchievement(achievement);
      setShareDialogOpen(true);
    }
  };

  if (achievementsLoading || xpSystem.loading || streakLoading) {
    return (
      <div className={cn("bg-background pb-20", !hideLayout && "min-h-screen")}>
        {!hideLayout && (
          <PageHeader
            title={t('achievements.title')}
            description={t('achievements.description')}
          />
        )}
        <div className="container mx-auto p-4 space-y-4">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  const content = (
    <div className={cn("p-4 space-y-6", !hideLayout && "container mx-auto")}>
      {!hideLayout && (
        <TutorialHint
          id="achievements_page"
          title={t('achievements.tutorialTitle')}
          message={t('achievements.tutorialMessage')}
        />
      )}

      {/* XP System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <XPSystem
          currentXP={xpSystem.currentXP}
          level={xpSystem.level}
          xpToNextLevel={xpSystem.xpToNextLevel}
          weeklyXP={xpSystem.weeklyXP}
          monthlyXP={xpSystem.monthlyXP}
        />
      </motion.div>

      {/* Streak Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-teal-50 to-pink-50 dark:from-teal-950/30 dark:to-pink-950/30 border-teal-200 dark:border-teal-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <img src="/images/rewards/series-icon.png" alt="Série Atual Icon" className="h-8 w-8" />
                <h3 className="text-lg font-semibold">Série Atual</h3>
              </div>
              <p className="text-3xl font-bold text-primary">
                {currentStreak} {t('achievements.days')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('achievements.record')}: {longestStreak} {t('achievements.days')}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <img src="/images/rewards/badge-7days.png" alt="Badge 7 Days" className="w-20 h-20" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold">{unlockedCount}</p>
          <p className="text-xs text-muted-foreground">{t('achievements.unlocked')}</p>
        </Card>

        <Card className="p-4 text-center">
          <Star className="h-6 w-6 mx-auto mb-2 text-teal-500" />
          <p className="text-2xl font-bold">{xpSystem.level}</p>
          <p className="text-xs text-muted-foreground">{t('achievements.level')}</p>
        </Card>

        <Card className="p-4 text-center">
          <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">{lockedAchievements.length}</p>
          <p className="text-xs text-muted-foreground">{t('achievements.locked')}</p>
        </Card>
      </motion.div>

      {/* Achievements Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              {t('achievements.all')} ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="unlocked">
              {t('achievements.unlockedTab')} ({unlockedCount})
            </TabsTrigger>
            <TabsTrigger value="locked">
              {t('achievements.lockedTab')} ({lockedAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  role="button"
                  tabIndex={achievement.unlocked ? 0 : undefined}
                  aria-label={achievement.unlocked ? `Compartilhar conquista: ${achievement.title}` : undefined}
                  {...(achievement.unlocked ? pressable(() => handleShareClick(achievement)) : {})}
                  className={achievement.unlocked ? "cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" : ""}
                >
                  <AchievementCard achievement={achievement} />
                </div>
                {achievement.unlocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleShareClick(achievement)}
                  >
                    {t('achievements.share')}
                  </Button>
                )}
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="unlocked" className="space-y-3 mt-4">
            {unlockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  role="button" 
                  tabIndex={0} 
                  {...pressable(() => handleShareClick(achievement))} 
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-shadow"
                  aria-label={`Ver detalhes e compartilhar: ${achievement.title}`}
                >
                  <AchievementCard achievement={achievement} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleShareClick(achievement)}
                >
                  {t('achievements.share')}
                </Button>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="locked" className="space-y-3 mt-4">
            {lockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AchievementCard achievement={achievement} />
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Share Dialog */}
      {selectedAchievement && (
        <AchievementShareDialog
          achievement={selectedAchievement}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );

  if (hideLayout) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background page-container pb-24">
      <PageHeader
        title={t('achievements.title')}
        description={t('achievements.description')}
      />
      {content}
    </div>
  );
}