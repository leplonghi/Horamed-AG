import { motion } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  onComplete: () => void;
}

export default function OnboardingStep4({ onComplete }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="p-6 rounded-full bg-primary/10">
            <Sparkles className="h-16 w-16 text-primary" />
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Tudo pronto!
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Vamos adicionar seu primeiro item agora ou você pode explorar o app primeiro
        </motion.p>
      </div>

      <motion.div
        className="space-y-4 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Adicione agora</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure seu primeiro remédio em 3 passos simples
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                onComplete();
                // Após navegar, abre o wizard
                setTimeout(() => {
                  window.location.href = "/adicionar-medicamento";
                }, 100);
              }}
            >
              Adicionar Primeiro Item
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={onComplete}>
            Explorar o app primeiro
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
