import { ReactNode, useState } from "react";
import { Check, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConditionalWizardStepProps {
  stepNumber: number;
  title: string;
  description: string;
  helpText?: string;
  icon: ReactNode;
  isComplete: boolean;
  isVisible: boolean;
  isActive: boolean;
  summary?: string;
  children: ReactNode;
  onToggle: () => void;
}

export function ConditionalWizardStep({
  stepNumber,
  title,
  description,
  helpText,
  icon,
  isComplete,
  isVisible,
  isActive,
  summary,
  children,
  onToggle,
}: ConditionalWizardStepProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.35, ease: "circOut" }}
      className="overflow-visible"
    >
      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-300 overflow-hidden",
          isActive
            ? "border-accent-highlight bg-card/80 shadow-lg shadow-accent-highlight/5 ring-1 ring-accent-highlight/20"
            : isComplete
              ? "border-primary/20 bg-background/40 hover:bg-background/60"
              : "border-transparent bg-muted/20"
        )}
      >
        {/* Active Glow Effect */}
        {isActive && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-highlight to-transparent opacity-50" />
        )}

        {/* Header - Always Visible */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3.5 p-4 text-left transition-all relative z-10",
            isActive && "pb-2"
          )}
        >
          {/* Step Number/Check Circle */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-all shadow-sm",
              isComplete
                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/20"
                : isActive
                  ? "bg-accent-highlight text-accent-highlight-foreground shadow-accent-highlight/30 scale-110"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {isComplete ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : (
              stepNumber
            )}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-base transition-colors",
                isActive ? "text-accent-highlight-foreground" : "text-muted-foreground"
              )}>{icon}</span>
              <h3
                className={cn(
                  "font-bold text-sm tracking-tight",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {title}
              </h3>
              {helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] bg-popover/95 backdrop-blur-sm">
                      <p className="text-xs">{helpText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Summary when collapsed and complete, or description when active/incomplete */}
            {isComplete && !isActive && summary ? (
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold truncate pl-6 mt-0.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500 inline-block" />
                {summary}
              </p>
            ) : (
              <p className={cn(
                "text-[11px] line-clamp-1 pl-6 mt-0.5 transition-colors",
                isActive ? "text-muted-foreground" : "text-muted-foreground/60"
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className={cn(
            "p-1.5 rounded-full transition-all duration-300",
            isActive ? "bg-accent-highlight/10 rotate-180" : "bg-transparent text-muted-foreground/50"
          )}>
            <ChevronDown className={cn(
              "h-4 w-4",
              isActive ? "text-accent-highlight-foreground" : "text-currentColor"
            )} />
          </div>
        </button>

        {/* Content - Animated Expand/Collapse */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1">
                <div className="ml-[48px] space-y-4">
                  <div className="h-px w-full bg-gradient-to-r from-border/50 to-transparent mb-3" />
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
