import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";
import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, fetchCollection, where } from "@/integrations/firebase";
import { IconToday as CalendarBlank, IconMedications as Pill, IconHealth as Heartbeat, IconWallet as Wallet, IconProfile as UserIcon } from "@/components/icons/HoramedIcons";

type NavIconComponent = React.ComponentType<{ className?: string; size?: number | string }>;

// Memoized nav item to prevent unnecessary re-renders
const NavItem = memo(function NavItem({
  path,
  icon: Icon,
  label,
  badge,
  isActive,
  onTap,
}: {
  path: string;
  icon: NavIconComponent;
  label: string;
  badge?: number;
  isActive: boolean;
  index: number;
  onTap: () => void;
}) {
  return (
    <Link
      to={path}
      onClick={onTap}
      role="tab"
      aria-current={isActive ? "page" : undefined}
      aria-selected={isActive}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 relative group",
        isActive
          ? "text-primary font-bold scale-110"
          : "text-primary/60 hover:text-primary/90 hover:bg-primary/5"
      )}
    >
      {isActive && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl"
          layoutId="activeTab"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <div className="relative">
        <Icon
          aria-hidden="true"
          className={cn(
            "h-6 w-6 transition-transform duration-200 relative z-10",
            isActive && "scale-110"
          )}
          size={24}
        />
        {badge && badge > 0 && (
          <Badge
            variant="destructive"
            aria-label={`${badge} notificações`}
            className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center z-20"
          >
            {badge}
          </Badge>
        )}
      </div>
      <span className={cn(
        "text-[10px] tracking-wide relative z-10",
        isActive ? "font-bold" : "font-medium"
      )}>{label}</span>
    </Link>
  );
});

function Navigation() {
  const location = useLocation();
  const { triggerLight } = useHapticFeedback();
  const { t } = useTranslation();

  // Optimized query - fetch expiring docs count only
  const { data: expiringCount = 0 } = useQuery({
    queryKey: ["expiring-docs-count"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return 0;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: documents } = await fetchCollection<any>(`users/${user.uid}/documents`, [
        where("expiresAt", "<=", thirtyDaysFromNow.toISOString()),
        where("expiresAt", ">=", new Date().toISOString())
      ]);

      return documents?.length || 0;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Memoize nav items to prevent recreating on each render
  const navItems = useMemo(() => [
    { path: "/hoje", icon: CalendarBlank, labelKey: "nav.today" },
    { path: "/medicamentos", icon: Pill, labelKey: "nav.routine" },
    { path: "/dashboard-saude", icon: Heartbeat, labelKey: "nav.health" },
    { path: "/carteira", icon: Wallet, labelKey: "nav.wallet", badge: expiringCount > 0 ? expiringCount : undefined },
    { path: "/perfil", icon: UserIcon, labelKey: "nav.profile" },
  ], [expiringCount]);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)]"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/90 to-card/80 backdrop-blur-xl border-t border-border/40" />
      <div className="relative max-w-4xl mx-auto px-2">
        <div role="tablist" aria-label="Seções do app" className="flex items-center justify-around h-16">
          {navItems.map((item, index) => (
            <NavItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={t(item.labelKey)}
              badge={item.badge}
              isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
              index={index}
              onTap={triggerLight}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

export default memo(Navigation);