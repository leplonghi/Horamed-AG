import { Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import QuickActionMenu from "./QuickActionMenu";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FloatingActionButton() {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  // Hide FAB on auth, onboarding, and pages with their own add button or specific context
  const hiddenRoutes = ["/auth", "/onboarding", "/rotina", "/medicamentos", "/estoque", "/historico"];
  const shouldHide = hiddenRoutes.some(route => location.pathname.startsWith(route));

  if (shouldHide) return null;

  return (
    <>
      <AnimatePresence>
        <motion.button
          onClick={() => setShowMenu(true)}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xl flex items-center gap-2 transition-all duration-300 group"
          style={{
            width: isExpanded ? 'auto' : '3.5rem',
            height: '3.5rem',
            paddingLeft: isExpanded ? '1.25rem' : '0.875rem',
            paddingRight: isExpanded ? '1.25rem' : '0.875rem',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            boxShadow: [
              "0 10px 30px -10px hsl(var(--primary) / 0.3)",
              "0 10px 40px -10px hsl(var(--primary) / 0.5)",
              "0 10px 30px -10px hsl(var(--primary) / 0.3)",
            ],
          }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            scale: { duration: 0.2 },
            opacity: { duration: 0.2 },
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          aria-label={t('common.quickActions')}
        >
          <Plus className="h-5 w-5 flex-shrink-0" />
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-sm font-medium ${isExpanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'
              } md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100`}
          >
            {t('common.quickActions')}
          </span>
        </motion.button>
      </AnimatePresence>
      <QuickActionMenu open={showMenu} onOpenChange={setShowMenu} />
    </>
  );
}
