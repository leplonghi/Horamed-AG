import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Sparkles, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { convertPDFToImages, isPDF } from "@/lib/pdfProcessor";
import { Progress } from "@/components/ui/progress";

import { useTranslation } from "@/contexts/LanguageContext";
interface OCRResult {
  title: string;
  issued_at?: string;
  expires_at?: string;
  provider?: string;
  category?: string;
  extracted_values?: Array<{
    parameter: string;
    value: number;
    unit: string;
    reference_range?: string;
  }>;
}

interface DocumentOCRProps {
  onResult: (result: OCRResult) => void;
}

export default function DocumentOCR({ onResult }: DocumentOCRProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
      
      // Se for PDF, mostrar ícone de PDF
      if (isPDF(file)) {
        setPreview("PDF_FILE");
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const extractFromImage = async (base64: string) => {
    let attempts = 0;
    
    while (attempts < 3) {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("extract-document", {
          body: { image: base64 },
        });

        if (invokeError) {
          if (invokeError.message?.includes('400') || invokeError.message?.includes('Invalid')) {
            throw invokeError;
          }
          if (attempts === 2) throw invokeError;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }

        if (data?.title) {
          return data;
        }
        break;
      } catch (err: any) {
        if (attempts === 2 || err.message?.includes('400') || err.message?.includes('Invalid')) {
          throw err;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return null;
  };

  const processImage = async () => {
    if (!preview || !currentFile) return;

    setProcessing(true);
    setError(null);
    toast.loading("Analisando documento com IA...", { id: "doc-ocr" });

    try {
      // Se for PDF, processar múltiplas páginas
      if (isPDF(currentFile)) {
        
        const pages = await convertPDFToImages(currentFile, 5);
        setTotalPages(pages.length);
        
        const allData: any[] = [];
        
        for (let i = 0; i < pages.length; i++) {
          setCurrentPage(i + 1);
          setExtractionProgress(((i + 1) / pages.length) * 100);
          
          toast.dismiss("doc-ocr");
          toast.loading(`Analisando página ${i + 1} de ${pages.length}...`, { id: "doc-ocr" });
          
          const pageData = await extractFromImage(pages[i].imageData);
          if (pageData) {
            allData.push(pageData);
          }
        }
        
        const firstValidData = allData.find(d => d.title);
        if (firstValidData) {
          toast.dismiss("doc-ocr");
          toast.success(`✓ PDF processado! ${allData.length} página(s) analisada(s).`, { duration: 4000 });
          
          onResult({
            title: firstValidData.title,
            issued_at: firstValidData.issued_at,
            expires_at: firstValidData.expires_at,
            provider: firstValidData.provider,
            category: firstValidData.category || "outro",
            extracted_values: firstValidData.extracted_values || [],
          });
          
          clearImage();
        } else {
          toast.dismiss("doc-ocr");
          setError("Não foi possível extrair informações do PDF");
          toast.error("Não foi possível processar o PDF");
        }
      } else {
        // Processar imagem única
        const data = await extractFromImage(preview);
        
        if (data?.title) {
          toast.dismiss("doc-ocr");
          toast.success("✓ Documento identificado com sucesso!", { duration: 3000 });
          
          onResult({
            title: data.title,
            issued_at: data.issued_at,
            expires_at: data.expires_at,
            provider: data.provider,
            category: data.category || "outro",
            extracted_values: data.extracted_values || [],
          });
          
          clearImage();
        } else {
          toast.dismiss("doc-ocr");
          setError("Não foi possível identificar informações no documento");
          toast.error("Não foi possível identificar o documento");
        }
      }
    } catch (error: any) {
      console.error("Error processing document:", error);
      toast.dismiss("doc-ocr");
      
      let errorMessage = "Erro ao processar documento. ";
      
      if (error.message?.includes('Invalid') || error.message?.includes('formato')) {
        errorMessage = "Formato inválido. Use PDF, PNG ou JPEG.";
      } else if (error.message?.includes('large') || error.message?.includes('size')) {
        errorMessage = "Arquivo muito grande. Use arquivos menores que 20MB.";
      } else if (error.message?.includes('nítida') || error.message?.includes('processar')) {
        errorMessage = "Qualidade baixa. Use imagens nítidas ou PDFs com texto selecionável.";
      } else if (error.message?.includes('PDF')) {
        errorMessage = "Erro ao processar PDF. " + error.message;
      } else {
        errorMessage += "Tente novamente.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setExtractionProgress(0);
      setCurrentPage(0);
      setTotalPages(0);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setCurrentFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-primary/20">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          📄 Capturar documento com IA
        </Label>
        <p className="text-sm text-muted-foreground">
          Tire uma foto, envie uma imagem ou PDF para preencher automaticamente os dados
        </p>
      </div>

      {!preview ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="h-28 flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
          >
            <Camera className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium">Câmera</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-28 flex-col gap-2 hover:bg-primary/10 hover:border-primary transition-all"
          >
            <Upload className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium">Galeria</span>
          </Button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg">
            {preview === "PDF_FILE" ? (
              <div className="w-full h-64 bg-muted flex flex-col items-center justify-center gap-3">
                <FileText className="w-16 h-16 text-primary" />
                <div className="text-center">
                  <p className="font-medium">PDF Selecionado</p>
                  <p className="text-sm text-muted-foreground">{currentFile?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(currentFile?.size ?? 0 / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={preview}
                alt={t("alt.documentPreview")}
                className="w-full h-auto max-h-64 object-contain bg-muted"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearImage}
              disabled={processing}
              className="absolute top-2 right-2 bg-background/90 hover:bg-background shadow-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {processing && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-foreground">
                      {totalPages > 0 
                        ? `Analisando página ${currentPage} de ${totalPages}` 
                        : "Analisando documento..."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Extraindo informações com Inteligência Artificial
                    </p>
                  </div>
                </div>
                {totalPages > 0 && (
                  <Progress value={extractionProgress} className="h-2" />
                )}
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </Card>
          )}

          {!processing && !error && (
            <Button
              type="button"
              onClick={processImage}
              className="w-full h-12 text-base font-semibold"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Extrair informações do documento
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
