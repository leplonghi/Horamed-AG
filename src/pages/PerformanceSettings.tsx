import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Gauge, Monitor, BatteryHigh, Leaf } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/Header";
import { useTranslation } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function PerformanceSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"standard" | "low">("standard");

  useEffect(() => {
    const saved = localStorage.getItem("performance_mode");
    if (saved === "low" || saved === "standard") {
      setMode(saved as "standard" | "low");
    }
  }, []);

  const handleModeChange = (value: "standard" | "low") => {
    setMode(value);
    localStorage.setItem("performance_mode", value);
    
    if (value === "low") {
      toast.info(t("settings.performance.lowPowerActive") || "Modo de Economia ativado: animações reduzidas.");
    } else {
      toast.success(t("settings.performance.standardActive") || "Modo padrão restaurado.");
    }

    // Emit event to notify other components immediately
    window.dispatchEvent(new StorageEvent("storage", { key: "performance_mode", newValue: value }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container max-w-2xl mx-auto px-4 pt-20 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/mais")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t("settings.performance.title") || "Desempenho & Acessibilidade"}</h1>
        </div>

        <div className="space-y-6">
          {/* Performance Mode Selection */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {t("settings.performance.display") || "Visual & Animações"}
            </h2>
            
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Modo de Desempenho</CardTitle>
                    <CardDescription>
                      Ajuste como o app se comporta no seu dispositivo.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={mode} 
                  onValueChange={(val) => handleModeChange(val as "standard" | "low")}
                  className="space-y-3"
                >
                  <div 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${mode === 'standard' ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted/50'}`}
                    onClick={() => handleModeChange("standard")}
                  >
                    <RadioGroupItem value="standard" id="standard" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="font-semibold text-sm cursor-pointer flex items-center gap-2">
                        Padrão (Visual Completo)
                        <Monitor className="h-3.5 w-3.5 opacity-60" />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Animações suaves, efeitos de desfoque e transições ricas. Ideal para dispositivos modernos.
                      </p>
                    </div>
                  </div>

                  <div 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${mode === 'low' ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted/50'}`}
                    onClick={() => handleModeChange("low")}
                  >
                    <RadioGroupItem value="low" id="low" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="low" className="font-semibold text-sm cursor-pointer flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        Economia & Velocidade
                        <Leaf className="h-3.5 w-3.5" />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reduz animações pesadas e efeitos de interface. Recomendado para celulares mais antigos ou para economizar bateria.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </section>

          {/* Accessibility Options */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Acessibilidade
            </h2>
            
            <Card className="border-border/60">
              <CardContent className="p-0 divide-y divide-border/60">
                <div className="flex items-center justify-between p-4 bg-transparent">
                  <div className="flex-1 pr-4">
                    <Label className="font-medium text-sm">Reduzir Movimento (OS)</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Respeita as configurações de acessibilidade do seu Sistema Operacional.
                    </p>
                  </div>
                  <Switch checked={window.matchMedia("(prefers-reduced-motion: reduce)").matches} disabled />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-transparent">
                  <div className="flex-1 pr-4">
                    <Label className="font-medium text-sm flex items-center gap-2">
                      Alto Contraste
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Melhora a visibilidade dos textos e elementos.
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="bg-muted/30 rounded-2xl p-4 border border-border/60">
            <div className="flex gap-3">
              <BatteryHigh className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Dica:</strong> Ativar o modo de economia pode aumentar a vida útil da sua bateria em até 15% durante o uso intenso do aplicativo, além de tornar a navegação mais instantânea.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
