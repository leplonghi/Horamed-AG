import { useState, useEffect } from "react";
import { fetchDocument } from "@/integrations/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconPlans, IconCrown as Crown, IconChevronRight as ChevronRight, IconHistory as History, IconFile as FileText, IconUsers as Users, IconGear as Settings, IconSignOut as LogOut, IconQuestion as HelpCircle, IconShield as Shield, IconBell as Bell, IconMedications as Pill, IconActivity as Activity, IconGift as Gift } from "@/components/icons/HoramedIcons";
import { BookOpen, Airplane as Plane, QrCode, Package, Folder as FolderHeart } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Colour palette per feature — avoids the "all icons are teal" cliché
const ICON_COLORS: Record<string, { bg: string; icon: string }> = {
  "/recompensas": { bg: "bg-amber-500/15", icon: "text-amber-500" },
  "/diario-efeitos": { bg: "bg-rose-500/15", icon: "text-rose-500" },
  "/viagem": { bg: "bg-sky-500/15", icon: "text-sky-500" },
  "/carteira": { bg: "bg-emerald-500/15", icon: "text-emerald-600" },
  "/historico": { bg: "bg-indigo-500/15", icon: "text-indigo-500" },
  "/estoque": { bg: "bg-orange-500/15", icon: "text-orange-500" },
  "/relatorios": { bg: "bg-teal-500/15", icon: "text-teal-600" },
  "/digitalizar": { bg: "bg-indigo-500/15", icon: "text-indigo-500" },
  "/perfil": { bg: "bg-teal-500/15", icon: "text-teal-500" },
  "/exportar": { bg: "bg-lime-500/15", icon: "text-lime-600" },
  "/tutorial": { bg: "bg-amber-500/15", icon: "text-amber-600" },
  "/notificacoes": { bg: "bg-red-500/15", icon: "text-red-500" },
  "/privacy": { bg: "bg-slate-500/15", icon: "text-slate-500" },
  "/help-support": { bg: "bg-teal-500/15", icon: "text-teal-500" },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function More() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const { isPremium } = useSubscription();
  const { profiles } = useUserProfiles();
  const currentUser = useAuth();

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      const user = currentUser?.user;
      if (!user) return;
      setUserEmail(user.email || "");

      const { data: profile } = await fetchDocument<{ full_name?: string; nickname?: string }>(
        "profiles",
        user.uid
      );
      if (profile) setUserName(profile.nickname || profile.full_name || "");
    } catch {
      // Silent fail
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast.success(t('profile.logoutSuccess'));
    } catch {
      toast.error(t('profile.logoutError'));
    }
  };

  const menuItems = [
    {
      title: t('more.rewards') || 'Recompensas & Séries',
      description: t('more.rewardsDesc') || 'Conquistas, cashback e proteção de série',
      icon: Gift,
      path: "/recompensas",
      badge: <Badge className="ml-2 bg-amber-500 hover:bg-amber-600 border-none text-white">{t('common.hot') || "HOT"}</Badge>,
    },
    {
      title: t('more.sideEffectsDiary'),
      description: t('more.sideEffectsDiaryDesc'),
      icon: Activity,
      path: "/diario-efeitos",
      badge: <Badge variant="secondary" className="ml-2">{t('common.new')}</Badge>,
    },
    {
      title: t('more.travelMode'),
      description: t('more.travelModeDesc'),
      icon: Plane,
      path: "/viagem",
      badge: <Badge variant="secondary" className="ml-2">{t('common.new')}</Badge>,
    },
    {
      title: t('more.healthWallet'),
      description: t('more.healthWalletDesc'),
      icon: FolderHeart,
      path: "/carteira",
      badge: null,
    },
    {
      title: t('more.doseHistory'),
      description: t('more.doseHistoryDesc'),
      icon: History,
      path: "/historico",
      badge: null,
    },
    {
      title: t('more.stockControl'),
      description: t('more.stockControlDesc'),
      icon: Package,
      path: "/estoque",
      badge: null,
    },
    {
      title: t('more.medicalReports'),
      description: t('more.medicalReportsDesc'),
      icon: FileText,
      path: "/relatorios",
      badge: isPremium ? null : <Badge variant="secondary" className="ml-2">{t('common.premium')}</Badge>,
    },
    {
      title: t('more.scanDocuments'),
      description: t('more.scanDocumentsDesc'),
      icon: QrCode,
      path: "/digitalizar",
      badge: null,
    },
    {
      title: t('more.familyCaregivers'),
      description: t('more.familyCaregiversDesc'),
      icon: Users,
      path: "/perfil",
      badge: isPremium
        ? <Badge className="ml-2">{profiles.length} {t('more.profiles')}</Badge>
        : <Badge variant="secondary" className="ml-2">{t('common.premium')}</Badge>,
    },
  ];

  const settingsItems = [
    { title: t('more.exportData'), description: t('more.exportDataDesc'), icon: FileText, path: "/exportar", badge: <Badge variant="secondary" className="ml-2">LGPD</Badge> },
    { title: t('more.tutorial'), description: t('more.tutorialDesc'), icon: BookOpen, path: "/tutorial" },
    { title: t('more.notifications'), description: t('more.notificationsDesc'), icon: Bell, path: "/notificacoes" },
    { title: t('more.privacyData'), description: t('more.privacyDataDesc'), icon: Shield, path: "/privacy" },
    { title: t('more.helpSupport'), description: t('more.helpSupportDesc'), icon: HelpCircle, path: "/help-support" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <Navigation />

      <main className="container max-w-2xl mx-auto px-4 pt-20 pb-8">

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="mb-6 overflow-hidden border-border/60">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {(userName || userEmail || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold">{userName || t('more.user')}</h2>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <SubscriptionBadge />
              </div>

              {!isPremium && (
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate('/planos')}
                    className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20 hover:opacity-90"
                    size="lg"
                  >
                    <IconPlans className="h-4 w-4 mr-2" />
                    {t('more.upgradePremium')}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Features */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider mb-3">{t('more.tools')}</h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {menuItems.map((item) => {
              const colors = ICON_COLORS[item.path] || { bg: "bg-primary/10", icon: "text-primary" };
              return (
                <motion.div key={item.path} variants={itemVariants}>
                  <Card
                    className="hover:shadow-md transition-all cursor-pointer active:scale-[0.99] border-border/60"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", colors.bg)}>
                            <item.icon className={cn("h-5 w-5", colors.icon)} />
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-1">
                              <h4 className="font-semibold text-sm">{item.title}</h4>
                              {item.badge}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Settings */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider mb-3">{t('more.settings')}</h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {settingsItems.map((item) => {
              const colors = ICON_COLORS[item.path] || { bg: "bg-muted/60", icon: "text-muted-foreground" };
              return (
                <motion.div key={item.path} variants={itemVariants}>
                  <Card
                    className="hover:shadow-md transition-all cursor-pointer active:scale-[0.99] border-border/60"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", colors.bg)}>
                            <item.icon className={cn("h-4 w-4", colors.icon)} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              {'badge' in item && item.badge}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Premium subscription management */}
        {isPremium && (
          <Card className="mb-4 border-border/60">
            <CardContent className="p-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/assinatura')}>
                <Settings className="h-4 w-4 mr-2" />
                {t('more.manageSubscription')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('more.signOut')}
            </Button>
          </CardContent>
        </Card>

        {/* Legal */}
        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>
            <button onClick={() => navigate('/terms')} className="hover:underline">{t('more.termsOfUse')}</button>
            {" • "}
            <button onClick={() => navigate('/privacy')} className="hover:underline">{t('more.privacy')}</button>
          </p>
          <p>HoraMed • {t('more.tagline')}</p>
        </div>
      </main>
    </div>
  );
}