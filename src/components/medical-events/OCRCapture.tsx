import React, { useState, useRef } from 'react';
import { Camera, Upload, ArrowsClockwise as RefreshCw, CheckCircle as CheckCircle2, Warning as AlertTriangle, FileText } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { processImage, OCRResult } from '@/lib/ocr/ocrProcessor';
import { classifyDocument, ClassificationResult } from '@/lib/ocr/documentClassifier';
import { extractData, ExtractedData } from '@/lib/ocr/dataExtractor';

interface OCRCaptureProps {
    onDataExtracted: (data: {
        text: string;
        classification: ClassificationResult;
        extractedData: ExtractedData;
        image: File;
    }) => void;
}

const OCRCapture: React.FC<OCRCaptureProps> = ({ onDataExtracted }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await processSelectFile(file);
    };

    const processSelectFile = async (file: File) => {
        setError(null);
        setIsProcessing(true);
        setProgress(0);

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        try {
            // 1. OCR Process
            const ocrResult = await processImage(file, (p) => {
                setProgress(p);
            });

            // 2. Classify
            const classification = classifyDocument(ocrResult.text);

            // 3. Extract Data
            const extractedData = extractData(ocrResult.text);

            // Notify parent
            onDataExtracted({
                text: ocrResult.text,
                classification,
                extractedData,
                image: file
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao processar imagem');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCameraClick = () => {
        // In a real mobile app/PWA, we would trigger camera capture
        // specific logic. For now, open file dialog with capture attribute
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                capture="environment" // Hint for mobile to use rear camera
            />

            {!previewUrl && (
                <div className="grid grid-cols-2 gap-4">
                    <Card
                        className="p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors border-dashed border-2"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Camera className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">Tirar Foto</span>
                    </Card>

                    <Card
                        className="p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors border-dashed border-2"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">Galeria</span>
                    </Card>
                </div>
            )}

            {previewUrl && (
                <Card className="overflow-hidden">
                    <div className="relative aspect-video bg-black">
                        <img
                            src={previewUrl}
                            alt="Document Preview"
                            className="w-full h-full object-contain"
                        />
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                                <RefreshCw className="w-8 h-8 text-white animate-spin mb-2" />
                                <p className="text-white text-sm font-medium mb-2">Lendo documento...</p>
                                <Progress value={progress} className="w-64 h-2" />
                                <p className="text-white/80 text-xs mt-1">{progress}%</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-muted/20 flex justify-between items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setPreviewUrl(null);
                                setError(null);
                            }}
                            disabled={isProcessing}
                        >
                            Trocar imagem
                        </Button>
                    </div>
                </Card>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
};

export default OCRCapture;

// UX Audit pass: placeholder aria-label <label>
