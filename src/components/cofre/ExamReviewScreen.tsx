import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { auth, updateDocument, addDocument } from "@/integrations/firebase";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExamReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function ExamReviewScreen({ documentId, extractedData, onComplete }: ExamReviewScreenProps) {
  const [examType, setExamType] = useState(extractedData.exam_type || "Exame de sangue");
  const [examDate, setExamDate] = useState(extractedData.issued_at || new Date().toISOString().split('T')[0]);
  const [lab, setLab] = useState(extractedData.provider || "");
  const [notes, setNotes] = useState(extractedData.notes || "");
  const [processing, setProcessing] = useState(false);

  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleSave = async () => {
    setProcessing(true);
    toast.loading(t('examReview.saving'), { id: "save-exam" });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error(t('errors.notAuthenticated'));

      // Update document
      await updateDocument(
        `users/${user.uid}/healthDocuments`,
        documentId,
        {
          extractionStatus: 'reviewed',
          meta: {
            ...extractedData,
            examType: examType,
            provider: lab,
            notes: notes,
          },
          updatedAt: new Date().toISOString()
        }
      );

      // Create exam record
      const examData = {
        userId: user.uid,
        profileId: activeProfile?.id,
        documentId: documentId,
        dataExame: examDate,
        laboratorio: lab || null,
        createdAt: new Date().toISOString()
      };

      const { data: newExam, error: examError } = await addDocument(`users/${user.uid}/exams`, examData);

      if (examError || !newExam) throw examError || new Error("Failed to create exam");

      if (newExam.id && extractedData.extracted_values?.length > 0) {
        // Insert exam values
        const valores = extractedData.extracted_values.map((val: any) => ({
          examId: newExam.id,
          parameter: val.parameter,
          value: val.value ? parseFloat(val.value) : null,
          valueText: val.value?.toString() || null,
          unit: val.unit || null,
          referenceText: val.reference_range || null,
          createdAt: new Date().toISOString()
        }));

        // Batch add or loop
        for (const valor of valores) {
          await addDocument(`users/${user.uid}/exams/${newExam.id}/results`, valor);
        }
      }

      toast.dismiss("save-exam");
      toast.success(t('examReview.savedSuccess'));

      navigate(`/carteira/${documentId}`);

    } catch (error: any) {
      console.error('Error saving exam:', error);
      toast.dismiss("save-exam");
      toast.error(t('examReview.saveError'));
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
          <h1 className="heading-page">{t('examReview.title')}</h1>
          <p className="text-description">
            {t('examReview.subtitle')}
          </p>
        </div>

        {/* Document Info */}
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

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('examReview.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('examReview.examType')}</Label>
              <Input
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                placeholder={t('examReview.examTypePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('examReview.examDate')}</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('examReview.lab')}</Label>
              <Input
                value={lab}
                onChange={(e) => setLab(e.target.value)}
                placeholder={t('examReview.labPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('examReview.observations')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('examReview.observationsPlaceholder')}
                rows={3}
              />
            </div>

            {extractedData.extracted_values?.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium">{t('examReview.valuesDetected')}: {extractedData.extracted_values.length} {t('examReview.parameters')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('examReview.valuesDesc')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className="w-full h-12"
          disabled={processing || !examType}
        >
          <Check className="mr-2 h-5 w-5" />
          {t('examReview.saveToWallet')}
        </Button>
      </div>
    </div>
  );
}