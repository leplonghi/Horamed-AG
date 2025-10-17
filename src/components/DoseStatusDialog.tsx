import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, SkipForward } from "lucide-react";

interface DoseStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doseName: string;
  onSelectStatus: (status: 'taken' | 'missed' | 'skipped') => void;
}

export default function DoseStatusDialog({
  open,
  onOpenChange,
  doseName,
  onSelectStatus,
}: DoseStatusDialogProps) {
  const handleSelect = (status: 'taken' | 'missed' | 'skipped') => {
    onSelectStatus(status);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Atualizar status</DialogTitle>
          <DialogDescription>
            Como você quer marcar <strong>{doseName}</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => handleSelect('taken')}
            className="w-full justify-start gap-4 h-auto py-4 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02]"
          >
            <div className="p-2 rounded-full bg-primary-foreground/20">
              <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-base">✓ Tomado</p>
              <p className="text-xs opacity-90">Tomei este medicamento no horário certo</p>
              <p className="text-xs opacity-75 mt-1">→ Reduz o estoque automaticamente</p>
            </div>
          </Button>

          <Button
            onClick={() => handleSelect('missed')}
            className="w-full justify-start gap-4 h-auto py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all hover:scale-[1.02]"
          >
            <div className="p-2 rounded-full bg-destructive-foreground/20">
              <XCircle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-base">⚠️ Esquecido</p>
              <p className="text-xs opacity-90">Esqueci de tomar e já passou o horário</p>
              <p className="text-xs opacity-75 mt-1">→ Afeta suas estatísticas de compromisso</p>
            </div>
          </Button>

          <Button
            onClick={() => handleSelect('skipped')}
            className="w-full justify-start gap-4 h-auto py-4 bg-muted hover:bg-muted/80 text-foreground border border-border transition-all hover:scale-[1.02]"
          >
            <div className="p-2 rounded-full bg-muted-foreground/10">
              <SkipForward className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-base">→ Pulado</p>
              <p className="text-xs text-muted-foreground">Decidi não tomar por algum motivo</p>
              <p className="text-xs text-muted-foreground mt-1">→ Não reduz estoque nem afeta estatísticas</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
