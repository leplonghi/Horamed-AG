import { useState } from "react";
import { auth, addDocument } from "@/integrations/firebase";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Scale, Calendar, Ruler } from "lucide-react";

import { useTranslation } from "@/contexts/LanguageContext";
interface HealthProfileSetupProps {
  open: boolean;
  onComplete: () => void;
}

export default function HealthProfileSetup({ open, onComplete }: HealthProfileSetupProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    birth_date: "",
    weight_kg: "",
    height_cm: "",
  });
  const { updateProfile, activeProfile } = useUserProfiles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.birth_date || !formData.weight_kg) {
      toast.error("Por favor, preencha data de nascimento e peso");
      return;
    }

    const weight = parseFloat(formData.weight_kg);
    if (weight <= 0 || weight > 500) {
      toast.error("Peso inválido");
      return;
    }

    // Validate age (must be at least 1 year old)
    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 1 || age > 150) {
      toast.error("Data de nascimento inválida");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      // Update active profile
      if (activeProfile) {
        await updateProfile(activeProfile.id, {
          birthDate: formData.birth_date,
          weightKg: weight,
          heightCm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        });
      } else {
        // Fallback if no active profile? Should not happen in this flow usually
        // Or we prompt to create one? 
        // For now, assuming activeProfile exists if user is authenticated and setup is showing
        console.warn("No active profile to update");
      }

      // Add to health history
      const { error: historyError } = await addDocument(`users/${user.uid}/healthHistory`, {
        userId: user.uid,
        weightKg: weight,
        heightCm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        recordedAt: new Date().toISOString()
      });

      if (historyError) console.warn("Could not save to health history:", historyError);

      toast.success("Perfil de saúde configurado com sucesso! 🎉");
      onComplete();
    } catch (error) {
      console.error("Error saving health profile:", error);
      toast.error("Erro ao salvar perfil de saúde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            🛡️ Para sua segurança
          </DialogTitle>
          <DialogDescription className="text-base">
            Antes de adicionar medicamentos, precisamos de alguns dados para fornecer alertas personalizados e proteger sua saúde.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Nascimento *
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date: e.target.value })
                }
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Peso (kg) *
              </Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                min="1"
                max="500"
                placeholder={t("placeholder.weight")}
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_kg: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height_cm" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Altura (cm)
              </Label>
              <Input
                id="height_cm"
                type="number"
                step="0.1"
                min="50"
                max="250"
                placeholder={t("placeholder.height")}
                value={formData.height_cm}
                onChange={(e) =>
                  setFormData({ ...formData, height_cm: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">Opcional - usado para cálculo de IMC</p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Isso nos permite:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Alertar sobre dosagens inadequadas para sua idade/peso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Detectar interações medicamentosas de alto risco</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Personalizar recomendações de saúde</span>
              </li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
