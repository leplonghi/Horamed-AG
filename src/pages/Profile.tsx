import { useState, useEffect } from "react";
import { auth } from "@/integrations/firebase";
import { toast } from "sonner";
import {
  Bell, Shield, HelpCircle, LogOut, FileDown,
  Crown, FileText, Smartphone, Activity, BookOpen, Plane, Gift, Watch
} from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import CaregiverManager from "@/components/CaregiverManager";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";

import { Switch } from "@/components/ui/switch";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";
import { motion } from "framer-motion";
import { LanguageSwitch } from "@/components/LanguageToggle";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// New refined components
import ProfileHeroHeader from "@/components/profile/ProfileHeroHeader";
import PlanOverviewCard from "@/components/profile/PlanOverviewCard";
import ProfileGamification from "@/components/profile/ProfileGamification";
import SmartProfileInsights from "@/components/profile/SmartProfileInsights"; // Keep smart insights, mostly for critical alerts
import OceanBackground from "@/components/ui/OceanBackground";
import { ProfileMenuSection, ProfileMenuItem } from "@/components/profile/ProfileMenu";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const { isPremium } = useSubscription();
  const { profiles, activeProfile, switchProfile } = useUserProfiles();
  const { preferences, toggleFitnessWidgets } = useFitnessPreferences();
  const { isAvailable: biometricAvailable, isBiometricEnabled, disableBiometric } = useBiometricAuth();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      setUserEmail(user.email || "");
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast.success(t('profile.logoutSuccess'));
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(t('profile.logoutError'));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <OceanBackground variant="page" />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="page-container container max-w-lg mx-auto px-4 pt-4 space-y-6 relative z-10"
      >
        {/* 1. HERO - Identity Only */}
        <motion.div variants={itemVariants}>
          <ProfileHeroHeader userEmail={userEmail} onLogout={handleLogout} />
        </motion.div>

        {/* 2. GAMIFICATION - Badges, Streaks, Rewards */}
        <motion.div variants={itemVariants}>
          <ProfileGamification />
        </motion.div>

        {/* 3. PLAN OVERVIEW - High Priority */}
        <motion.div variants={itemVariants}>
          <PlanOverviewCard />
        </motion.div>

        {/* 3. PROFILE SWITCHER - Compact */}
        {profiles && profiles.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.profiles')}</h3>
              {isPremium && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate('/perfil/criar')}>
                  + {t('common.add')}
                </Button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x scrollbar-hide">
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer snap-start transition-all",
                      isActive ? "opacity-100" : "opacity-60 scale-95"
                    )}
                    onClick={() => switchProfile(p)}
                  >
                    <Avatar className={cn(
                      "h-14 w-14 border-2 transition-all",
                      isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}>
                      <AvatarImage src={p.avatarUrl} />
                      <AvatarFallback className="text-xs">{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "text-[10px] font-medium text-center truncate w-full px-1",
                      isActive ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
              {!isPremium && profiles.length < 2 && (
                <div
                  className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer opacity-50 hover:opacity-80"
                  onClick={() => navigate('/planos')}
                >
                  <div className="h-14 w-14 rounded-full bg-muted border-2 border-dashed border-muted-foreground flex items-center justify-center">
                    <Crown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground text-center">{t('common.new')}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 4. SMART INSIGHTS (Only critical stuff, less noise) */}
        <motion.div variants={itemVariants}>
          <SmartProfileInsights />
        </motion.div>

        {/* 6. SETTINGS GROUP - Consolidate Account, Prefs, Support */}
        <motion.div variants={itemVariants} className="space-y-4">
          <ProfileMenuSection title={t('common.settings')}>
            <ProfileMenuItem
              icon={Watch}
              label={t('profile.devices')}
              onClick={() => navigate('/integracoes')}
              color="text-indigo-500"
              bgColor="bg-indigo-500/10"
            />

            <Dialog>
              <DialogTrigger asChild>
                <div role="button" tabIndex={0} className="w-full">
                  <ProfileMenuItem
                    icon={Shield}
                    label={t('profile.caregivers')}
                    color="text-purple-500"
                    bgColor="bg-purple-500/10"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('profile.manageCaregivers')}</DialogTitle>
                </DialogHeader>
                <CaregiverManager />
              </DialogContent>
            </Dialog>

            <ProfileMenuItem
              icon={Bell}
              label={t('profile.notifications')}
              onClick={() => navigate('/notificacoes/config')}
              color="text-orange-500"
              bgColor="bg-orange-500/10"
            />

            <ProfileMenuItem
              icon={Smartphone}
              label={t('profile.alarmsLabel')}
              onClick={() => navigate('/alarmes')}
              color="text-cyan-500"
              bgColor="bg-cyan-500/10"
            />

            <ProfileMenuItem
              icon={Plane}
              label={t('more.travelMode')}
              onClick={() => navigate('/viagem')}
              color="text-sky-500"
              bgColor="bg-sky-500/10"
            />

            {/* In-line Toggles */}
            <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border-b border-border/40 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <span className="font-medium text-sm">{t('profile.wellnessWidgets')}</span>
              </div>
              <Switch checked={preferences.showFitnessWidgets} onCheckedChange={toggleFitnessWidgets} />
            </div>

            {/* Language */}
            <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm last:border-0 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <span className="font-medium text-sm">{t('common.language')}</span>
              </div>
              <LanguageSwitch />
            </div>

            {biometricAvailable && isBiometricEnabled && (
              <ProfileMenuItem
                icon={Shield}
                label={t('profile.disableBiometric')}
                onClick={disableBiometric}
                color="text-red-500"
                bgColor="bg-red-500/10"
                value="ON"
              />
            )}
          </ProfileMenuSection>

          {/* SUPPORT & LEGAL - Less prominent */}
          <ProfileMenuSection title={t('profile.support')}>
            <ProfileMenuItem
              icon={HelpCircle}
              label={t('profile.helpLabel')}
              onClick={() => navigate('/ajuda')}
            />
            <ProfileMenuItem
              icon={FileText}
              label={t('profile.termsLabel')}
              onClick={() => navigate('/termos')}
            />
            <ProfileMenuItem
              icon={LogOut}
              label={t('profile.logout')}
              onClick={handleLogout}
              isDestructive
              bgColor="bg-destructive/10"
            />
          </ProfileMenuSection>
        </motion.div>

        <div className="text-center text-[10px] text-muted-foreground/60 pt-4 pb-8">
          HoraMed v1.0.0
        </div>
      </motion.main>

      <Navigation />
    </div>
  );
}
