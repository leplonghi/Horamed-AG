import { AlertCircle, FileText, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useDocumentos } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";

export default function DocumentReviewAlert() {
  const { activeProfile } = useUserProfiles();
  const { data: documentos } = useDocumentos({ profileId: activeProfile?.id });

  if (!documentos) return null;

  const needsReview = documentos.filter(
    (doc) => doc.status_extraction === 'pending_review'
  );

  const expiringSoon = documentos.filter(
    (doc) => doc.expires_at && new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  if (needsReview.length === 0 && expiringSoon.length === 0) return null;

  return (
    <div className="space-y-3">
      {needsReview.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <FileText className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-700 dark:text-yellow-400">
            Documentos para revisar
          </AlertTitle>
          <AlertDescription className="text-yellow-700/80 dark:text-yellow-400/80">
            {needsReview.length} documento{needsReview.length > 1 ? 's' : ''} com dados extraídos 
            automaticamente aguardando sua revisão.
            <Link to="/cofre">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-yellow-500/50 hover:bg-yellow-500/20"
              >
                Revisar agora
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {expiringSoon.length > 0 && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <Calendar className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">
            Documentos vencendo
          </AlertTitle>
          <AlertDescription className="text-destructive/80">
            {expiringSoon.length} documento{expiringSoon.length > 1 ? 's vencem' : ' vence'} nos 
            próximos 30 dias. Considere renovar ou atualizar.
            <Link to="/cofre">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-destructive/50 hover:bg-destructive/20"
              >
                Ver documentos
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
