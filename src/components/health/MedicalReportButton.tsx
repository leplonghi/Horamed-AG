import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Share2, QrCode, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { downloadMedicalReport, shareMedicalReport } from "@/lib/medicalReportPdf";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface MedicalReportButtonProps {
  variant?: "default" | "card";
  className?: string;
}

export default function MedicalReportButton({ 
  variant = "default",
  className 
}: MedicalReportButtonProps) {
  const { language } = useLanguage();
  const { isPremium } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDownload = async () => {
    if (!isPremium) {
      toast.error(language === 'pt' 
        ? 'Recurso Premium. Faça upgrade para gerar relatórios.'
        : 'Premium feature. Upgrade to generate reports.');
      return;
    }

    setIsGenerating(true);
    try {
      await downloadMedicalReport(language);
      toast.success(language === 'pt' ? 'Relatório gerado!' : 'Report generated!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(language === 'pt' ? 'Erro ao gerar relatório' : 'Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!isPremium) {
      toast.error(language === 'pt' 
        ? 'Recurso Premium. Faça upgrade para compartilhar.'
        : 'Premium feature. Upgrade to share.');
      return;
    }

    setIsSharing(true);
    try {
      const url = await shareMedicalReport(language);
      setShareUrl(url);
      toast.success(language === 'pt' ? 'Link gerado!' : 'Link generated!');
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error(language === 'pt' ? 'Erro ao gerar link' : 'Error generating link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(language === 'pt' ? 'Link copiado!' : 'Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "card") {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={className}
          >
            <Card className={cn(
              "cursor-pointer transition-all duration-300",
              "bg-gradient-to-br from-primary/10 to-purple-500/10",
              "border border-primary/20 shadow-[var(--shadow-glass)]",
              "hover:shadow-[var(--shadow-glass-hover)] hover:border-primary/40"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-500">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">
                      {language === 'pt' ? 'Relatório Médico' : 'Medical Report'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {language === 'pt' 
                        ? 'Gere PDF para consultas'
                        : 'Generate PDF for appointments'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    PDF
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialogOpen(true);
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {language === 'pt' ? 'Enviar' : 'Share'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {language === 'pt' ? 'Compartilhar Relatório' : 'Share Report'}
            </DialogTitle>
            <DialogDescription>
              {language === 'pt' 
                ? 'Gere um link para seu médico acessar seu relatório.'
                : 'Generate a link for your doctor to access your report.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!shareUrl ? (
              <Button 
                className="w-full gap-2"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {language === 'pt' ? 'Gerando...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    {language === 'pt' ? 'Gerar Link de Compartilhamento' : 'Generate Share Link'}
                  </>
                )}
              </Button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-xl">
                    <QRCodeSVG value={shareUrl} size={180} />
                  </div>

                  {/* Share URL */}
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg truncate"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    ⏱️ {language === 'pt' 
                      ? 'Link válido por 7 dias'
                      : 'Link valid for 7 days'}
                  </p>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShareUrl(null)}
                  >
                    {language === 'pt' ? 'Gerar Novo Link' : 'Generate New Link'}
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button 
      onClick={handleDownload}
      disabled={isGenerating}
      className={cn("gap-2", className)}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {language === 'pt' ? 'Relatório Médico' : 'Medical Report'}
    </Button>
  );
}
