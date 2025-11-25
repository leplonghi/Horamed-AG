import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VaccineReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function VaccineReviewScreen({ documentId, extractedData, onComplete }: VaccineReviewScreenProps) {
  const [vaccineName, setVaccineName] = useState(extractedData.vaccine_name || "");
  const [doseNumber, setDoseNumber] = useState(extractedData.dose_number || "");
  const [applicationDate, setApplicationDate] = useState(extractedData.issued_at || new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(extractedData.provider || "");
  const [professional, setProfessional] = useState(extractedData.doctor_name || "");
  const [processing, setProcessing] = useState(false);

  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!vaccineName) {
      toast.error("Nome da vacina é obrigatório");
      return;
    }

    setProcessing(true);
    toast.loading("Salvando vacina...", { id: "save-vaccine" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Update document
      await supabase
        .from('documentos_saude')
        .update({
          status_extraction: 'reviewed',
          meta: {
            ...extractedData,
            vaccine_name: vaccineName,
            dose_number: doseNumber,
            provider: location,
            doctor_name: professional,
          }
        })
        .eq('id', documentId);

      // Create vaccination record
      await supabase
        .from('vaccination_records')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id,
          document_id: documentId,
          vaccine_name: vaccineName,
          dose_number: doseNumber ? parseInt(doseNumber) : null,
          application_date: applicationDate,
          vaccination_location: location || null,
          vaccinator_name: professional || null,
        });

      toast.dismiss("save-vaccine");
      toast.success("✓ Vacina salva na Carteira de Vacinação!");

      navigate("/carteira-vacina");

    } catch (error: any) {
      console.error('Erro ao salvar vacina:', error);
      toast.dismiss("save-vaccine");
      toast.error("Erro ao salvar vacina. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-page">Revise sua vacina</h1>
          <p className="text-description">
            Confirme os dados da vacina antes de salvar
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
                    {format(new Date(extractedData.issued_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da vacina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da vacina *</Label>
              <Input
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
                placeholder="Ex: Influenza, Hepatite B"
              />
            </div>

            <div className="space-y-2">
              <Label>Dose</Label>
              <Input
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
                placeholder="Ex: 1ª dose, 2ª dose, reforço"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de aplicação</Label>
              <Input
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Local de aplicação (opcional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: UBS, Clínica"
              />
            </div>

            <div className="space-y-2">
              <Label>Profissional (opcional)</Label>
              <Input
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                placeholder="Nome do profissional"
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full h-12"
          disabled={processing || !vaccineName}
        >
          <Check className="mr-2 h-5 w-5" />
          Salvar na Carteira de Vacinação
        </Button>
      </div>
    </div>
  );
}
