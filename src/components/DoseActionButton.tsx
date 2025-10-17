import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoseActionButtonProps {
  variant: 'taken' | 'snooze' | 'more';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function DoseActionButton({
  variant,
  onClick,
  disabled = false,
  className,
}: DoseActionButtonProps) {
  const config = {
    taken: {
      icon: CheckCircle2,
      label: "✓ Tomei",
      className: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    snooze: {
      icon: Clock,
      label: "⏰ Adiar",
      className: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    },
    more: {
      icon: MoreHorizontal,
      label: "Mais opções",
      className: "bg-muted hover:bg-muted/80 text-foreground",
    },
  };

  const { icon: Icon, label, className: variantClass } = config[variant];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-2 transition-all hover:scale-105",
        variantClass,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
