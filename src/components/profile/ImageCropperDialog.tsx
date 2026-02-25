
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { getCroppedImg } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageCropperDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string | null;
    onCropComplete: (croppedImageBlob: Blob) => void;
    isLoading?: boolean;
}

export default function ImageCropperDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
    isLoading = false
}: ImageCropperDialogProps) {
    const { t } = useTranslation();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            console.warn("Missing imageSrc or croppedAreaPixels", { hasImage: !!imageSrc, hasPixels: !!croppedAreaPixels });
            return;
        }

        try {
            console.log("Starting crop processing...");
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (croppedImage) {
                console.log("Crop successful, blob size:", croppedImage.size);
                onCropComplete(croppedImage);
            } else {
                console.error("getCroppedImg returned null");
                toast.error("Erro ao cortar a imagem. Tente outra foto.");
            }
        } catch (e) {
            console.error("Exception in handleSave:", e);
            toast.error("Erro ao processar imagem.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('profile.editPhoto') || 'Editar Foto'}</DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-80 bg-black rounded-md overflow-hidden my-4">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={onZoomChange}
                            showGrid={false}
                            cropShape="round"
                        />
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Zoom</span>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {t('common.save') || 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
