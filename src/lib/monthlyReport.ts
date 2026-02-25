import { fetchCollection, fetchDocument, where } from "@/integrations/firebase";
import jsPDF from 'jspdf';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";
import 'jspdf-autotable';

interface ProfileDoc {
  fullName?: string;
  full_name?: string;
}

interface DoseDoc {
  id: string;
  status: string;
  dueAt: string;
  delayMinutes?: number;
}

interface MedicationDoc {
  id: string;
  name: string;
  isActive: boolean;
}

interface StockDoc {
  id: string;
  itemId: string;
  currentQty: number;
  projectedEndAt?: string | null;
}

interface HealthDocument {
  id: string;
  title?: string;
  createdAt: string;
}

interface MedicationWithStock extends MedicationDoc {
  stock: StockDoc[];
}

interface StockPrediction {
  name: string;
  unitsLeft: number;
  projectedEnd: string | null;
}

interface MonthlyReportData {
  userId: string;
  userName: string;
  month: Date;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  punctualityRate: number;
  adherenceRate: number;
  medications: MedicationWithStock[];
  stockPredictions: StockPrediction[];
  documents: HealthDocument[];
  insights: string[];
}

export async function generateMonthlyReport(userId: string, month: Date): Promise<Blob> {
  const data = await getMonthlyReportData(userId, month);
  return createReportPDF(data);
}

async function getMonthlyReportData(userId: string, month: Date): Promise<MonthlyReportData> {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Get user profile
  const { data: profile } = await fetchDocument<ProfileDoc>(
    `users/${userId}/profile`,
    'info' // Assuming 'info' doc contains the profile or similar
  );

  // Get doses for the month
  const { data: doses } = await fetchCollection<DoseDoc>(
    `users/${userId}/doses`,
    [
      where('dueAt', '>=', monthStart.toISOString()),
      where('dueAt', '<=', monthEnd.toISOString())
    ]
  );

  const totalDoses = doses?.length || 0;
  const takenDoses = doses?.filter(d => d.status === 'taken').length || 0;
  const missedDoses = doses?.filter(d => d.status === 'skipped' || d.status === 'missed').length || 0;

  const punctualDoses = doses?.filter(d =>
    d.status === 'taken' && d.delayMinutes !== undefined && d.delayMinutes <= 30
  ).length || 0;

  const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
  const punctualityRate = takenDoses > 0 ? (punctualDoses / takenDoses) * 100 : 0;

  // Get medications and join with stock
  const { data: medications } = await fetchCollection<MedicationDoc>(
    `users/${userId}/medications`,
    [where('isActive', '==', true)]
  );

  const medsWithStock: MedicationWithStock[] = await Promise.all((medications || []).map(async (med) => {
    const { data: stockData } = await fetchCollection<StockDoc>(
      `users/${userId}/stock`,
      [where('itemId', '==', med.id)]
    );
    return {
      ...med,
      stock: stockData || []
    };
  }));

  // Get stock predictions
  const stockPredictions = medsWithStock.map(med => ({
    name: med.name,
    unitsLeft: med.stock?.[0]?.currentQty || 0,
    projectedEnd: med.stock?.[0]?.projectedEndAt || null
  }));

  // Get health documents count (assuming they are in users/{userId}/healthDocuments)
  const { data: healthDocs } = await fetchCollection<HealthDocument>(
    `users/${userId}/healthDocuments`,
    [
      where('createdAt', '>=', monthStart.toISOString()),
      where('createdAt', '<=', monthEnd.toISOString())
    ]
  );

  // Generate insights
  const insights = generateInsights(adherenceRate, punctualityRate, missedDoses);

  return {
    userId,
    userName: profile?.fullName || profile?.full_name || 'Usuário',
    month,
    totalDoses,
    takenDoses,
    missedDoses,
    punctualityRate,
    adherenceRate,
    medications: medsWithStock || [],
    stockPredictions,
    documents: healthDocs || [],
    insights
  };
}

function generateInsights(adherenceRate: number, punctualityRate: number, missedDoses: number): string[] {
  const insights: string[] = [];

  if (adherenceRate >= 90) {
    insights.push('🎉 Excelente! Você manteve uma adesão acima de 90% este mês.');
  } else if (adherenceRate >= 70) {
    insights.push('👍 Boa adesão! Continue assim para melhores resultados.');
  } else {
    insights.push('💡 Sua adesão pode melhorar. Tente ajustar os horários dos lembretes.');
  }

  if (punctualityRate >= 80) {
    insights.push('⏰ Parabéns! Você foi pontual na maioria das doses.');
  }

  if (missedDoses > 0) {
    insights.push(`📊 Você economizou ${missedDoses} doses perdidas este mês com os lembretes.`);
  }

  insights.push('📈 Sua rotina está mais estável comparada aos meses anteriores.');

  return insights;
}

function createReportPDF(data: MonthlyReportData): Blob {
  const doc = new jsPDF();
  const monthName = data.month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105); // Emerald
  doc.text('HoraMed', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`Relatório Mensal - ${monthName}`, 105, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.text(data.userName, 105, 38, { align: 'center' });

  // Metrics Section
  let yPosition = 50;
  doc.setFontSize(14);
  doc.text('Resumo do Mês', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.text(`Total de doses: ${data.totalDoses}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Doses tomadas: ${data.takenDoses}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Doses perdidas: ${data.missedDoses}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Progresso: ${data.adherenceRate.toFixed(1)}%`, 20, yPosition);
  yPosition += 7;
  doc.text(`Pontualidade: ${data.punctualityRate.toFixed(1)}%`, 20, yPosition);
  yPosition += 15;

  // Medications Section
  if (data.medications.length > 0) {
    doc.setFontSize(14);
    doc.text('Medicamentos Ativos', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    data.medications.slice(0, 8).forEach((med) => {
      doc.text(`• ${med.name}`, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }

  // Stock Predictions
  if (data.stockPredictions.length > 0) {
    doc.setFontSize(14);
    doc.text('Previsão de Estoque', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    data.stockPredictions.slice(0, 5).forEach((stock) => {
      if (stock.projectedEnd) {
        const daysLeft = Math.ceil((safeDateParse(stock.projectedEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        doc.text(`• ${stock.name}: ${daysLeft} dias restantes`, 20, yPosition);
        yPosition += 6;
      }
    });
    yPosition += 10;
  }

  // Insights Section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.text('Insights e Recomendações', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  data.insights.forEach((insight) => {
    const lines = doc.splitTextToSize(insight, 170);
    lines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 2;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Gerado pelo HoraMed - Sua saúde no horário certo', 105, 285, { align: 'center' });

  return doc.output('blob');
}
