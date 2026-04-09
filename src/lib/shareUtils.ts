/**
 * shareUtils — Web Share API with WhatsApp fallback
 * On mobile: uses native share sheet (can share PDF files)
 * On desktop / unsupported: opens WhatsApp Web with text
 */

export async function sharePDF(blob: Blob, filename: string, title: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      // User cancelled or share failed — fall through to WhatsApp
      if ((err as Error).name === 'AbortError') return;
    }
  }
  // Fallback: WhatsApp with text
  const text = encodeURIComponent(`${title} — HoraMed`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

export function shareTextViaWhatsApp(text: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

/**
 * Generates a human-readable report summary for WhatsApp sharing
 */
export function buildReportSummary(params: {
  patientName: string;
  adherencePercent: number;
  activeMeds: string[];
  periodDays: number;
}): string {
  const { patientName, adherencePercent, activeMeds, periodDays } = params;
  const medList = activeMeds.slice(0, 5).join(', ') + (activeMeds.length > 5 ? '...' : '');
  return [
    `📊 *Relatório HoraMed — ${patientName}*`,
    ``,
    `✅ Adesão nos últimos ${periodDays} dias: *${adherencePercent}%*`,
    `💊 Medicamentos ativos: ${medList}`,
    ``,
    `Gerado pelo app HoraMed — lembretes inteligentes de medicamentos.`,
  ].join('\n');
}
