
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, Loader2, FileText } from 'lucide-react';

interface OCRCaptureProps {
    onDataExtracted: (data: any) => void;
}

const OCRCapture = ({ onDataExtracted }: OCRCaptureProps) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSimulateScan = () => {
        setIsProcessing(true);
        // Simulate processing delay
        setTimeout(() => {
            const mockData = {
                text: "Consulta Dr. Paulo Cardiologista 12/12/2025 14:00",
                extractedData: {
                    doctorName: "Paulo Silva",
                    date: new Date("2025-12-12T14:00:00"),
                    time: "14:00",
                    crm: "12345-SP"
                },
                classification: {
                    type: "consultation",
                    confidence: 0.95
                }
            };
            onDataExtracted(mockData);
            setIsProcessing(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 pt-4 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Camera className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold">Captura Inteligente</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Tire uma foto ou faça upload da sua receita, pedido de exame ou atestado.
                </p>
            </div>

            <div className="grid gap-4">
                <Button
                    variant="outline"
                    className="h-24 border-dashed border-2 flex flex-col gap-2 hover:bg-muted/50"
                    onClick={handleSimulateScan}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                    <span className="font-semibold">
                        {isProcessing ? "Processando..." : "Selecionar Arquivo"}
                    </span>
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Ou</span>
                    </div>
                </div>

                <Button
                    className="w-full"
                    onClick={handleSimulateScan}
                    disabled={isProcessing}
                >
                    <Camera className="mr-2 w-4 h-4" />
                    Abrir Câmera
                </Button>
            </div>

            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-900">
                <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Nossa IA irá ler as informações automaticamente. Verifique se a foto está nítida e bem iluminada.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default OCRCapture;
