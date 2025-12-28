import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Copy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrescriptionStatusBadgeProps {
  status: 'valid' | 'expiring_soon' | 'expired';
  daysUntilExpiry?: number;
  isDuplicate?: boolean;
  isPurchased?: boolean;
  className?: string;
}

export function PrescriptionStatusBadge({ 
  status, 
  daysUntilExpiry, 
  isDuplicate,
  isPurchased,
  className 
}: PrescriptionStatusBadgeProps) {
  const { t } = useLanguage();
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Validity status */}
      {status === 'valid' && !isPurchased && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('prescription.valid')}
        </Badge>
      )}
      
      {status === 'expiring_soon' && !isPurchased && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {t('prescription.expiresIn')} {daysUntilExpiry} {daysUntilExpiry === 1 ? t('prescription.day') : t('prescription.days')}
        </Badge>
      )}
      
      {status === 'expired' && !isPurchased && (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('prescription.expired')}
        </Badge>
      )}

      {/* Purchase status */}
      {isPurchased && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('prescription.used')}
        </Badge>
      )}

      {/* Duplicate indicator */}
      {isDuplicate && (
        <Badge variant="secondary">
          <Copy className="h-3 w-3 mr-1" />
          {t('prescription.duplicate')}
        </Badge>
      )}
    </div>
  );
}
