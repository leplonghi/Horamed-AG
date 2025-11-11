import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileCheck, Camera, Sparkles, Shield } from "lucide-react";

interface CofreHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CofreHelpDialog({ open, onOpenChange }: CofreHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Como funciona o Cofre?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 h-fit">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">Envie ou fotografe</h3>
              <p className="text-sm text-muted-foreground">
                Você pode enviar PDFs ou tirar fotos dos seus documentos de saúde: receitas médicas, 
                exames laboratoriais, cartões de vacina e relatórios médicos.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 h-fit">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">Reconhecimento automático</h3>
              <p className="text-sm text-muted-foreground">
                O HoraMed identifica automaticamente o tipo do documento e extrai informações importantes 
                como medicamentos, datas, médicos e resultados de exames.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 h-fit">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">Revise e confirme</h3>
              <p className="text-sm text-muted-foreground">
                Após a extração, você revisa os dados identificados e pode fazer ajustes antes de salvar. 
                Tudo fica organizado e fácil de encontrar.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 h-fit">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">Segurança e privacidade</h3>
              <p className="text-sm text-muted-foreground">
                Todos os seus documentos são armazenados de forma criptografada e segura. 
                Apenas você tem acesso aos seus dados de saúde.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            💡 <strong>Dica:</strong> Para melhores resultados, tire fotos com boa iluminação e 
            certifique-se de que todo o texto está visível e legível.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
