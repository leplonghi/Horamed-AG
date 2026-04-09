import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Warning as AlertTriangle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";

/**
 * Shows a sticky banner when the user has 3 or fewer days left in their trial.
 * Dismissed per session via sessionStorage.
 */
export default function TrialReminderBanner() {
  const { isOnTrial, trialDaysLeft } = useSubscription();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("trial_banner_dismissed") === "true"
  );

  const shouldShow = isOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3 && !dismissed;

  const handleDismiss = () => {
    sessionStorage.setItem("trial_banner_dismissed", "true");
    setDismissed(true);
  };

  const isLastDay = trialDaysLeft === 0;
  const label = isLastDay
    ? "Seu período Premium termina hoje!"
    : `${trialDaysLeft} dia${trialDaysLeft === 1 ? "" : "s"} restantes do seu Premium grátis`;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-full z-50"
        >
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium ${
              isLastDay
                ? "bg-destructive text-destructive-foreground"
                : "bg-amber-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isLastDay ? (
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Crown className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate("/planos")}
                className="rounded-md bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 text-xs font-semibold whitespace-nowrap"
              >
                Assinar agora
              </button>
              <button
                onClick={handleDismiss}
                aria-label="Fechar aviso de trial"
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
