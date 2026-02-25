import Tesseract from 'tesseract.js';

export interface BoundingBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface OCRResult {
    text: string;
    confidence: number;
    words: {
        text: string;
        confidence: number;
        bbox: BoundingBox;
    }[];
}

/**
 * Process an image and extract text using Tesseract.js
 * @param imageSource URL or File object of the image
 * @param progressCallback Optional callback for progress updates (0-100)
 */
export const processImage = async (
    imageSource: string | File,
    progressCallback?: (progress: number) => void
): Promise<OCRResult> => {
    try {
        const worker = await Tesseract.createWorker({
            logger: (m) => {
                if (m.status === 'recognizing text' && progressCallback) {
                    progressCallback(Math.floor(m.progress * 100));
                }
            },
        });

        await worker.loadLanguage('por');
        await worker.initialize('por');

        const result = await worker.recognize(imageSource);

        await worker.terminate();

        return {
            text: result.data.text,
            confidence: result.data.confidence,
            words: result.data.words.map((w) => ({
                text: w.text,
                confidence: w.confidence,
                bbox: w.bbox,
            })),
        };
    } catch (error) {
        console.error('OCR Processing Error:', error);
        throw new Error('Falha ao processar imagem. Tente novamente com uma imagem mais clara.');
    }
};
