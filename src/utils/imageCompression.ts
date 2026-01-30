
/**
 * Utilitário leve para compressão de imagens usando Canvas API.
 * Evita dependências pesadas como browser-image-compression.
 */

export interface CompressionOptions {
    maxWidthOrHeight: number;
    quality: number; // 0.1 a 1.0
    maxSizeMB?: number; // Meta aproximada
}

const defaultOptions: CompressionOptions = {
    maxWidthOrHeight: 1920,
    quality: 0.8,
    maxSizeMB: 1,
};

export async function compressImage(file: File, options: Partial<CompressionOptions> = {}): Promise<File> {
    // Se não for imagem, retorna o arquivo original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Se já for pequeno o suficiente, retorna original
    if (options.maxSizeMB && file.size / 1024 / 1024 < options.maxSizeMB) {
        return file;
    }

    const config = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Calcular novas dimensões mantendo aspect ratio
            if (width > config.maxWidthOrHeight || height > config.maxWidthOrHeight) {
                const ratio = width / height;
                if (width > height) {
                    width = config.maxWidthOrHeight;
                    height = Math.round(width / ratio);
                } else {
                    height = config.maxWidthOrHeight;
                    width = Math.round(height * ratio);
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Tentar comprimir
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Compression failed'));
                        return;
                    }

                    // Se o blob resultante for maior que o original, retorna o original
                    if (blob.size >= file.size) {
                        resolve(file);
                        return;
                    }

                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg', // Força JPEG para melhor compressão
                        lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                },
                'image/jpeg', // Sempre converter para JPEG para reduzir tamanho
                config.quality
            );
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };

        img.src = url;
    });
}
