import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t, language } = useLanguage();
  
  const config = {
    taken: {
      icon: CheckCircle2,
      label: language === 'pt' ? 'Tomei' : 'Took it',
      className: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-11 text-base px-5",
    },
    snooze: {
      icon: Clock,
      label: language === 'pt' ? 'Depois' : 'Later',
      className: "bg-secondary hover:bg-secondary/80 text-secondary-foreground h-11",
    },
    more: {
      icon: MoreHorizontal,
      label: "",
      className: "bg-muted hover:bg-muted/80 text-foreground w-11 h-11 px-0",
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