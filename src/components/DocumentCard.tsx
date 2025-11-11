import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, FileText, TestTube, Syringe, Stethoscope, ClipboardList, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentoSaude } from "@/hooks/useCofre";

interface DocumentCardProps {
  document: DocumentoSaude;
  onView: (id: string) => void;
  onShare: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const categoryIcons = {
  receitas: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  exames: { icon: TestTube, color: "text-purple-500", bg: "bg-purple-50" },
  vacinas: { icon: Syringe, color: "text-green-500", bg: "bg-green-50" },
  consultas: { icon: Stethoscope, color: "text-orange-500", bg: "bg-orange-50" },
  relatorios: { icon: ClipboardList, color: "text-gray-500", bg: "bg-gray-50" },
};

export function DocumentCard({ document, onView, onShare, onEdit, onDelete }: DocumentCardProps) {
  const categorySlug = document.categorias_saude?.slug || "relatorios";
  const categoryConfig = categoryIcons[categorySlug as keyof typeof categoryIcons] || categoryIcons.relatorios;
  const Icon = categoryConfig.icon;

  const expiresIn = document.expires_at
    ? Math.floor((new Date(document.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const needsReview = document.status_extraction === "pending" || !document.reviewed_at;
  const hasError = document.status_extraction === "failed";

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`${categoryConfig.bg} p-3 rounded-lg flex-shrink-0 h-fit`}>
          <Icon className={`h-6 w-6 ${categoryConfig.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
              {document.title || "Documento sem título"}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(document.id)}>
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(document.id)}>
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(document.id)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(document.id)} className="text-destructive">
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
            {document.provider && `${document.provider} • `}
            {document.issued_at
              ? `Emitido em ${format(new Date(document.issued_at), "dd/MM/yyyy", { locale: ptBR })}`
              : "Data não informada"}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">
              {document.categorias_saude?.label || "Outros"}
            </Badge>

            {hasError && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Erro na extração
              </Badge>
            )}

            {needsReview && !hasError && (
              <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300">
                <AlertCircle className="h-3 w-3" />
                Revisar
              </Badge>
            )}

            {expiresIn !== null && expiresIn >= 0 && expiresIn <= 30 && (
              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                <Clock className="h-3 w-3" />
                Vence em {expiresIn} dias
              </Badge>
            )}

            {expiresIn !== null && expiresIn < 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Vencido
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
