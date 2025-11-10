export async function fileToDataURL(file: File): Promise<string> {
  const isImage = file.type?.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  
  if (!file || (!isImage && !isPDF)) {
    throw new Error("Selecione um arquivo de imagem (PNG, JPG, WEBP) ou PDF.");
  }
  
  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    throw new Error("Arquivo muito grande. Máximo de 10MB.");
  }
  
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file); // garante prefixo data:image/...;base64, ou data:application/pdf;base64,
  });
}
