import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface DocumentReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function DocumentReviewScreen({ documentId, extractedData, onComplete }: DocumentReviewScreenProps) {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState(extractedData.title || t('docReview.defaultTitle'));
  const [date, setDate] = useState(extractedData.issued_at || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(extractedData.notes || "");
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!title) {
      toast.error(t('docReview.titleRequired'));
      return;
    }

    setProcessing(true);
    toast.loading(t('docReview.saving'), { id: "save-doc" });

    try {
      // Update document
      await supabase
        .from('documentos_saude')
        .update({
          title,
          issued_at: date,
          notes,
          status_extraction: 'reviewed',
        })
        .eq('id', documentId);

      toast.dismiss("save-doc");
      toast.success(t('docReview.savedSuccess'));

      navigate(`/carteira/${documentId}`);

    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.dismiss("save-doc");
      toast.error(t('docReview.saveError'));
    } finally {
      setProcessing(false);
    }
  };

  const dateLocale = language === 'pt' ? ptBR : enUS;
  const dateFormat = language === 'pt' ? "dd 'de' MMMM 'de' yyyy" : "MMMM dd, yyyy";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-page">{t('docReview.title')}</h1>
          <p className="text-description">
            {t('docReview.subtitle')}
          </p>
        </div>

        {/* Document Info */}
        {(extractedData.provider || extractedData.issued_at) && (
          <Card>
            <CardContent className="p-4 space-y-2">
              {extractedData.provider && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">🏥</span>
                  <span className="text-sm">{extractedData.provider}</span>
                </div>
              )}
              {extractedData.issued_at && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">📅</span>
                  <span className="text-sm">
                    {format(new Date(extractedData.issued_at), dateFormat, { locale: dateLocale })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('docReview.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('docReview.docTitle')} *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('docReview.titlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('docReview.date')}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('docReview.observations')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('docReview.observationsPlaceholder')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full h-12"
          disabled={processing || !title}
        >
          <Check className="mr-2 h-5 w-5" />
          {t('docReview.saveToWallet')}
        </Button>
      </div>
    </div>
  );
}