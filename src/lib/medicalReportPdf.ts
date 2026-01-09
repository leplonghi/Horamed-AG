import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface MedicalReportData {
  profile: {
    full_name: string;
    birth_date?: string;
    weight_kg?: number;
    height_cm?: number;
  };
  medications: Array<{
    name: string;
    dose_text?: string;
    category?: string;
    times: string[];
    adherenceRate: number;
  }>;
  adherence: {
    overall: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  vitals: Array<{
    date: string;
    pressao_sistolica?: number;
    pressao_diastolica?: number;
    frequencia_cardiaca?: number;
    glicemia?: number;
    peso_kg?: number;
  }>;
  sideEffects: Array<{
    date: string;
    medication: string;
    tags: string[];
    notes?: string;
  }>;
  interactions?: Array<{
    drugA: string;
    drugB: string;
    severity: string;
    description: string;
  }>;
}

const COLORS = {
  primary: [82, 109, 255] as [number, number, number],
  secondary: [100, 116, 139] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
};

export async function generateMedicalReport(
  logoImage?: string,
  language: 'pt' | 'en' = 'pt'
): Promise<Blob> {
  const data = await fetchReportData();
  const doc = new jsPDF();
  let yPos = 15;

  // Header with Logo
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'WEBP', 15, yPos, 25, 25);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  // Title
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text(language === 'pt' ? 'Relatório Médico' : 'Medical Report', logoImage ? 50 : 15, yPos + 10);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    language === 'pt' 
      ? `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
      : `Generated: ${format(new Date(), "MM/dd/yyyy 'at' HH:mm")}`,
    logoImage ? 50 : 15,
    yPos + 18
  );

  yPos = 50;

  // Patient Info Section
  yPos = addSectionHeader(doc, language === 'pt' ? '👤 Dados do Paciente' : '👤 Patient Info', yPos);
  
  const patientInfo = [
    [language === 'pt' ? 'Nome' : 'Name', data.profile.full_name || '-'],
    [language === 'pt' ? 'Data de Nascimento' : 'Birth Date', data.profile.birth_date ? format(new Date(data.profile.birth_date), 'dd/MM/yyyy') : '-'],
    [language === 'pt' ? 'Peso' : 'Weight', data.profile.weight_kg ? `${data.profile.weight_kg} kg` : '-'],
    [language === 'pt' ? 'Altura' : 'Height', data.profile.height_cm ? `${data.profile.height_cm} cm` : '-'],
  ];

  if (data.profile.weight_kg && data.profile.height_cm) {
    const bmi = data.profile.weight_kg / Math.pow(data.profile.height_cm / 100, 2);
    patientInfo.push(['IMC', `${bmi.toFixed(1)} kg/m²`]);
  }

  autoTable(doc, {
    startY: yPos,
    body: patientInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 100 }
    },
    margin: { left: 15 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Adherence Summary
  yPos = addSectionHeader(doc, language === 'pt' ? '📊 Resumo de Adesão' : '📊 Adherence Summary', yPos);

  const adherenceColor = data.adherence.overall >= 80 ? COLORS.success :
                        data.adherence.overall >= 60 ? COLORS.warning : COLORS.danger;

  doc.setFillColor(...adherenceColor);
  doc.roundedRect(15, yPos, 60, 30, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(`${data.adherence.overall}%`, 45, yPos + 18, { align: 'center' });
  doc.setFontSize(8);
  doc.text(language === 'pt' ? 'ADESÃO GERAL' : 'OVERALL ADHERENCE', 45, yPos + 26, { align: 'center' });

  const trendText = data.adherence.trend === 'up' 
    ? (language === 'pt' ? '↑ Melhorando' : '↑ Improving')
    : data.adherence.trend === 'down'
    ? (language === 'pt' ? '↓ Reduzindo' : '↓ Declining')
    : (language === 'pt' ? '→ Estável' : '→ Stable');

  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(10);
  doc.text(`${language === 'pt' ? 'Mês anterior' : 'Last month'}: ${data.adherence.lastMonth}% ${trendText}`, 85, yPos + 18);

  yPos += 40;

  // Medications Table
  yPos = checkPageBreak(doc, yPos, 60);
  yPos = addSectionHeader(doc, language === 'pt' ? '💊 Medicamentos Ativos' : '💊 Active Medications', yPos);

  if (data.medications.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[
        language === 'pt' ? 'Medicamento' : 'Medication',
        language === 'pt' ? 'Dose' : 'Dosage',
        language === 'pt' ? 'Horários' : 'Times',
        language === 'pt' ? 'Adesão' : 'Adherence'
      ]],
      body: data.medications.map(med => [
        med.name,
        med.dose_text || '-',
        med.times.join(', ') || '-',
        `${med.adherenceRate}%`
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        3: { halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Vital Signs
  if (data.vitals.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionHeader(doc, language === 'pt' ? '❤️ Sinais Vitais (Últimos 7 dias)' : '❤️ Vital Signs (Last 7 days)', yPos);

    autoTable(doc, {
      startY: yPos,
      head: [[
        language === 'pt' ? 'Data' : 'Date',
        language === 'pt' ? 'Pressão' : 'BP',
        language === 'pt' ? 'FC' : 'HR',
        language === 'pt' ? 'Glicemia' : 'Glucose',
        language === 'pt' ? 'Peso' : 'Weight'
      ]],
      body: data.vitals.slice(0, 7).map(vital => [
        format(new Date(vital.date), 'dd/MM'),
        vital.pressao_sistolica && vital.pressao_diastolica 
          ? `${vital.pressao_sistolica}/${vital.pressao_diastolica}`
          : '-',
        vital.frequencia_cardiaca ? `${vital.frequencia_cardiaca} bpm` : '-',
        vital.glicemia ? `${vital.glicemia} mg/dL` : '-',
        vital.peso_kg ? `${vital.peso_kg} kg` : '-'
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Drug Interactions
  if (data.interactions && data.interactions.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeader(doc, language === 'pt' ? '⚠️ Interações Medicamentosas' : '⚠️ Drug Interactions', yPos);

    autoTable(doc, {
      startY: yPos,
      head: [[
        language === 'pt' ? 'Medicamentos' : 'Medications',
        language === 'pt' ? 'Severidade' : 'Severity',
        language === 'pt' ? 'Descrição' : 'Description'
      ]],
      body: data.interactions.map(int => [
        `${int.drugA} + ${int.drugB}`,
        int.severity,
        int.description
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.warning,
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Side Effects
  if (data.sideEffects.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeader(doc, language === 'pt' ? '🩺 Efeitos Colaterais Registrados' : '🩺 Recorded Side Effects', yPos);

    autoTable(doc, {
      startY: yPos,
      head: [[
        language === 'pt' ? 'Data' : 'Date',
        language === 'pt' ? 'Medicamento' : 'Medication',
        language === 'pt' ? 'Sintomas' : 'Symptoms',
        language === 'pt' ? 'Notas' : 'Notes'
      ]],
      body: data.sideEffects.slice(0, 10).map(se => [
        format(new Date(se.date), 'dd/MM'),
        se.medication,
        se.tags.join(', '),
        se.notes || '-'
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  addFooter(doc, language);

  return doc.output('blob');
}

function addSectionHeader(doc: jsPDF, title: string, yPos: number): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 20, yPos + 5.5);
  return yPos + 12;
}

function checkPageBreak(doc: jsPDF, yPos: number, requiredSpace: number): number {
  if (yPos > 270 - requiredSpace) {
    doc.addPage();
    return 20;
  }
  return yPos;
}

function addFooter(doc: jsPDF, language: 'pt' | 'en') {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text(
      `${language === 'pt' ? 'Página' : 'Page'} ${i} ${language === 'pt' ? 'de' : 'of'} ${pageCount} | HoraMed`,
      105,
      285,
      { align: 'center' }
    );
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      language === 'pt' 
        ? 'Este relatório é apenas informativo e não substitui consulta médica.'
        : 'This report is for informational purposes only and does not replace medical consultation.',
      105,
      290,
      { align: 'center' }
    );
  }
}

async function fetchReportData(): Promise<MedicalReportData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const thirtyDaysAgo = subDays(new Date(), 30);
  const sixtyDaysAgo = subDays(new Date(), 60);

  // Fetch profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, birth_date, weight_kg, height_cm')
    .eq('user_id', user.id)
    .single();

  // Fetch medications with adherence
  const { data: items } = await supabase
    .from('items')
    .select(`
      id, name, dose_text, category,
      schedules (times)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Fetch dose instances for adherence calculation
  const { data: doses } = await supabase
    .from('dose_instances')
    .select('item_id, status, due_at')
    .gte('due_at', thirtyDaysAgo.toISOString());

  // Calculate adherence per medication
  const medications = (items || []).map(item => {
    const itemDoses = (doses || []).filter(d => d.item_id === item.id);
    const taken = itemDoses.filter(d => d.status === 'taken').length;
    const total = itemDoses.length;
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    const schedules = item.schedules as any[];
    const times = schedules?.[0]?.times || [];

    return {
      name: item.name,
      dose_text: item.dose_text,
      category: item.category,
      times: Array.isArray(times) ? times : [],
      adherenceRate
    };
  });

  // Calculate overall adherence
  const allCurrentDoses = (doses || []).filter(d => new Date(d.due_at) >= thirtyDaysAgo);
  const allPreviousDoses = (doses || []).filter(d => 
    new Date(d.due_at) >= sixtyDaysAgo && new Date(d.due_at) < thirtyDaysAgo
  );

  const currentTaken = allCurrentDoses.filter(d => d.status === 'taken').length;
  const previousTaken = allPreviousDoses.filter(d => d.status === 'taken').length;

  const overallAdherence = allCurrentDoses.length > 0 
    ? Math.round((currentTaken / allCurrentDoses.length) * 100) 
    : 0;
  const lastMonthAdherence = allPreviousDoses.length > 0
    ? Math.round((previousTaken / allPreviousDoses.length) * 100)
    : 0;

  const trend: 'up' | 'down' | 'stable' = overallAdherence > lastMonthAdherence 
    ? 'up' 
    : overallAdherence < lastMonthAdherence 
    ? 'down' 
    : 'stable';

  // Fetch vital signs
  const { data: vitals } = await supabase
    .from('sinais_vitais')
    .select('data_medicao, pressao_sistolica, pressao_diastolica, frequencia_cardiaca, glicemia, peso_kg')
    .eq('user_id', user.id)
    .order('data_medicao', { ascending: false })
    .limit(10);

  // Fetch side effects
  const { data: sideEffectsData } = await supabase
    .from('side_effects_log')
    .select('recorded_at, item_id, side_effect_tags, notes, items(name)')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(10);

  // Fetch drug interactions
  const { data: interactions } = await supabase
    .from('drug_interactions')
    .select('*');

  // Filter relevant interactions
  const medNames = medications.map(m => m.name.toLowerCase());
  const relevantInteractions = (interactions || []).filter(int => {
    return medNames.some(n => n.includes(int.drug_a.toLowerCase())) &&
           medNames.some(n => n.includes(int.drug_b.toLowerCase()));
  }).map(int => ({
    drugA: int.drug_a,
    drugB: int.drug_b,
    severity: int.interaction_type,
    description: int.description
  }));

  return {
    profile: {
      full_name: profileData?.full_name || user.email || 'Paciente',
      birth_date: profileData?.birth_date,
      weight_kg: profileData?.weight_kg,
      height_cm: profileData?.height_cm
    },
    medications,
    adherence: {
      overall: overallAdherence,
      lastMonth: lastMonthAdherence,
      trend
    },
    vitals: (vitals || []).map(v => ({
      date: v.data_medicao,
      pressao_sistolica: v.pressao_sistolica,
      pressao_diastolica: v.pressao_diastolica,
      frequencia_cardiaca: v.frequencia_cardiaca,
      glicemia: v.glicemia,
      peso_kg: v.peso_kg
    })),
    sideEffects: (sideEffectsData || []).map(se => ({
      date: se.recorded_at,
      medication: (se.items as any)?.name || 'Desconhecido',
      tags: se.side_effect_tags || [],
      notes: se.notes
    })),
    interactions: relevantInteractions
  };
}

export async function downloadMedicalReport(language: 'pt' | 'en' = 'pt') {
  const blob = await generateMedicalReport(undefined, language);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-medico-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareMedicalReport(language: 'pt' | 'en' = 'pt'): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate token for sharing
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Save share record
  const { error } = await supabase
    .from('medical_shares')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString()
    });

  if (error) throw error;

  const baseUrl = window.location.origin;
  return `${baseUrl}/compartilhar/relatorio/${token}`;
}
