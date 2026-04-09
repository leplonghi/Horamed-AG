import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-background/95 backdrop-blur-md text-foreground border-border/50 shadow-2xl rounded-2xl p-4 flex gap-3 items-center ring-1 ring-border/20",
          description: "text-muted-foreground text-sm leading-relaxed",
          actionButton:
            "bg-primary text-primary-foreground font-semibold rounded-xl h-10 px-5 transition-all hover:scale-105 active:scale-95",
          cancelButton:
            "bg-secondary text-secondary-foreground font-semibold rounded-xl h-10 px-5 transition-all hover:bg-secondary/80",
          success: "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5",
          error: "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
