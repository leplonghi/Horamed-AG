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
        
        <div className="space-y-2 pt-2">
          <Button
            onClick={() => handleSelect('taken')}
            className="w-full justify-start gap-3 h-auto py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
            <div className="text-left">
              <p className="font-semibold">Tomado</p>
              <p className="text-xs opacity-90">Eu tomei este medicamento</p>
            </div>
          </Button>

          <Button
            onClick={() => handleSelect('missed')}
            className="w-full justify-start gap-3 h-auto py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <XCircle className="h-5 w-5 text-destructive-foreground" />
            <div className="text-left">
              <p className="font-semibold">Esquecido</p>
              <p className="text-xs opacity-90">Eu esqueci de tomar</p>
            </div>
          </Button>

          <Button
            onClick={() => handleSelect('skipped')}
            className="w-full justify-start gap-3 h-auto py-3 bg-muted hover:bg-muted/80 text-foreground"
          >
            <SkipForward className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="font-semibold">Pulado</p>
              <p className="text-xs text-muted-foreground">Decidi não tomar (não reduz estoque)</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
