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
            className="w-full justify-start gap-3 h-auto py-3 bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Tomado</p>
              <p className="text-xs opacity-90">Eu tomei este medicamento</p>
            </div>
          </Button>

          <Button
            onClick={() => handleSelect('missed')}
            variant="destructive"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <XCircle className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Esquecido</p>
              <p className="text-xs opacity-90">Eu esqueci de tomar</p>
            </div>
          </Button>

          <Button
            onClick={() => handleSelect('skipped')}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <SkipForward className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Pulado</p>
              <p className="text-xs text-muted-foreground">Decidi não tomar</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
