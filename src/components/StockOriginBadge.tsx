import { FileText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Props {
  prescriptionId: string | null;
  prescriptionTitle: string | null;
  lastRefillAt: string | null;
}

export function StockOriginBadge({ prescriptionId, prescriptionTitle, lastRefillAt }: Props) {
  const navigate = useNavigate();

  if (!prescriptionId && !lastRefillAt) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Package className="h-3 w-3" />
        <span>Adicionado manualmente</span>
      </Badge>
    );
  }

  if (prescriptionId && prescriptionTitle) {
    return (
      <button
        onClick={() => navigate(`/carteira/${prescriptionId}`)}
        className="inline-flex"
      >
        <Badge variant="secondary" className="gap-1.5 cursor-pointer hover:bg-secondary/80 transition-colors">
          <FileText className="h-3 w-3" />
          <span>Da receita: {prescriptionTitle}</span>
        </Badge>
      </button>
    );
  }

  if (lastRefillAt) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Package className="h-3 w-3" />
        <span>Reabastecido manualmente</span>
      </Badge>
    );
  }

  return null;
}
