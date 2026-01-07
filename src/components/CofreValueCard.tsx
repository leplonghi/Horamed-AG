import { FileText, Upload, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface CofreValueCardProps {
  onAddDocument: () => void;
}

export default function CofreValueCard({ onAddDocument }: CofreValueCardProps) {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">
              {language === 'pt' 
                ? 'Seus documentos ajudam seu médico' 
                : 'Your documents help your doctor'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'pt'
                ? 'Mantenha receitas e exames organizados. Na próxima consulta, tenha tudo na palma da mão.'
                : 'Keep prescriptions and exams organized. At your next appointment, have everything at your fingertips.'}
            </p>
            <Button 
              onClick={onAddDocument}
              className="w-full sm:w-auto rounded-xl font-semibold"
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              {language === 'pt' ? 'Enviar documento' : 'Upload document'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
