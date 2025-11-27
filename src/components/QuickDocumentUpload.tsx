import { Camera, Upload, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface QuickDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickDocumentUpload({ open, onOpenChange }: QuickDocumentUploadProps) {
  const navigate = useNavigate();

  const options = [
    {
      icon: Camera,
      label: "Tirar Foto",
      description: "Fotografe a receita ou exame",
      onClick: () => {
        onOpenChange(false);
        navigate("/scan");
      },
    },
    {
      icon: Upload,
      label: "Enviar Arquivo",
      description: "PDF, JPG ou PNG",
      onClick: () => {
        onOpenChange(false);
        navigate("/carteira/upload");
      },
    },
    {
      icon: Edit,
      label: "Preencher Manualmente",
      description: "Adicionar sem arquivo",
      onClick: () => {
        onOpenChange(false);
        navigate("/carteira/criar-manual");
      },
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Adicionar Documento</DrawerTitle>
          <DrawerDescription>
            Como você gostaria de adicionar o documento?
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 p-6">
          {options.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              className="w-full h-auto py-4 flex items-start gap-4 hover:bg-accent"
              onClick={option.onClick}
            >
              <option.icon className="h-6 w-6 mt-1" />
              <div className="flex-1 text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
        <div className="p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancelar
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
