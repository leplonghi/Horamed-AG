import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Camera, Upload } from "lucide-react";

interface AddDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDocumentModal({ open, onOpenChange }: AddDocumentModalProps) {
  const navigate = useNavigate();

  const handleUploadFile = () => {
    onOpenChange(false);
    navigate("/cofre/upload");
  };

  const handleScanDocument = () => {
    onOpenChange(false);
    navigate("/document-scan");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adicionar Documento</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleUploadFile}
            className="h-auto py-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform"
            variant="outline"
          >
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base">Enviar arquivo</p>
              <p className="text-sm text-muted-foreground">PDF ou imagem do seu dispositivo</p>
            </div>
          </Button>

          <Button
            onClick={handleScanDocument}
            className="h-auto py-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform"
            variant="outline"
          >
            <div className="p-3 rounded-full bg-primary/10">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base">Tirar foto / Digitalizar</p>
              <p className="text-sm text-muted-foreground">Use a câmera para capturar o documento</p>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            O HoraMend identifica automaticamente o tipo e extrai os dados para você
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
