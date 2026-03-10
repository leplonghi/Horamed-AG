import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Spinner as Loader2, Download, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { symptomService } from '@/lib/symptomService';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function ClinicalBriefGenerator() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const locale = language === 'pt' ? ptBR : enUS;

    const generateBrief = async () => {
        if (!user) return;
        setIsGenerating(true);

        try {
            const endDate = new Date();
            const startDate = subDays(endDate, 30);

            // 1. Fetch Doses for adherence calculation
            const dosesRef = collection(db, `users/${user.uid}/doses`);
            const dosesQuery = query(
                dosesRef,
                where('dueAt', '>=', startDate.toISOString()),
                where('dueAt', '<=', endDate.toISOString())
            );
            const dosesSnapshot = await getDocs(dosesQuery);

            let taken = 0;
            let missed = 0;
            const activeMeds = new Set<string>();

            dosesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === 'taken') taken++;
                if (data.status === 'missed' || data.status === 'skipped') missed++;
                if (data.itemName) activeMeds.add(data.itemName);
            });

            const totalDoses = taken + missed;
            const adherence = totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 0;

            // 2. Fetch Symptom Logs
            const logs = await symptomService.getLogsByDateRange(user.uid, startDate, endDate);

            // Process symptoms
            const symptomCounts: Record<string, number> = {};
            logs.forEach(log => {
                log.symptoms.forEach(sym => {
                    symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
                });
            });

            // Assemble PDF
            const doc = new jsPDF();
            let yPos = 20;

            // Header
            doc.setFontSize(18);
            doc.setTextColor(15, 118, 110); // Emerald 700
            doc.text(t('brief.pdfTitle'), 105, yPos, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            yPos += 8;
            doc.text(
                `${format(startDate, 'dd MMM', { locale })} - ${format(endDate, 'dd MMM yyyy', { locale })}`,
                105, yPos, { align: 'center' }
            );

            // Disclaimer
            yPos += 15;
            doc.setFillColor(254, 243, 199); // Amber 100
            doc.rect(15, yPos, 180, 12, 'F');
            doc.setFontSize(8);
            doc.setTextColor(180, 83, 9); // Amber 700
            doc.text(
                t('brief.pdfDisclaimer'),
                105, yPos + 7, { align: 'center' }
            );

            // Adherence section
            yPos += 25;
            doc.setFontSize(12);
            doc.setTextColor(15, 118, 110);
            doc.text(t('brief.pdfAdherence'), 15, yPos);

            yPos += 8;
            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            doc.text(t('brief.pdfAdherenceRate', { rate: adherence }), 15, yPos);

            // Medications list
            yPos += 15;
            doc.setFontSize(12);
            doc.setTextColor(15, 118, 110);
            doc.text(t('brief.pdfActiveMeds'), 15, yPos);

            const medsData = Array.from(activeMeds).map(m => [m]);
            if (medsData.length > 0) {
                yPos += 5;
                autoTable(doc, {
                    startY: yPos,
                    body: medsData,
                    theme: 'plain',
                    styles: { fontSize: 10, textColor: [51, 65, 85], cellPadding: 2 },
                    margin: { left: 15 }
                });
                yPos = (doc as any).lastAutoTable.finalY + 10;
            } else {
                yPos += 8;
                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text(t('brief.pdfNoMeds'), 15, yPos);
                yPos += 10;
            }

            // Symptoms section
            doc.setFontSize(12);
            doc.setTextColor(15, 118, 110);
            doc.text(t('brief.pdfSymptomsLogged'), 15, yPos);

            const symptomsList = Object.entries(symptomCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([sym, count]) => [t(`symptom.list.${sym}`), `${count} ${t('brief.logsStr')}`]);

            if (symptomsList.length > 0) {
                yPos += 5;
                autoTable(doc, {
                    startY: yPos,
                    head: [[t('brief.pdfSymptomCol'), t('brief.pdfOccurrencesCol')]],
                    body: symptomsList,
                    theme: 'striped',
                    headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255] }, // Teal 500
                    styles: { fontSize: 10 },
                    margin: { left: 15, right: 15 }
                });
                yPos = (doc as any).lastAutoTable.finalY + 10;
            } else {
                yPos += 8;
                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text(t('brief.pdfNoSymptoms'), 15, yPos);
                yPos += 10;
            }

            // Notes & Correlations
            const logsWithCorrelations = logs.filter(l => l.correlatedMedications && l.correlatedMedications.length > 0);
            if (logsWithCorrelations.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(15, 118, 110);
                doc.text(t('brief.pdfCorrelations'), 15, yPos);

                yPos += 8;
                doc.setFontSize(9);
                doc.setTextColor(51, 65, 85);

                logsWithCorrelations.slice(0, 5).forEach(c => {
                    doc.text(t('brief.pdfCorrelationItem', { date: format(c.date, 'dd/MM'), meds: c.correlatedMedications?.join(', ') }), 15, yPos);
                    yPos += 6;
                });
            }

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(t('brief.pdfFooter', { current: i, total: pageCount }), 105, 290, { align: 'center' });
            }

            doc.save(`clinical-brief-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast.success(t('brief.success'));

        } catch (e) {
            console.error(e);
            toast.error(t('brief.error'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm mb-6">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-row items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full text-emerald-600 dark:text-emerald-300">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-xl text-emerald-900 dark:text-emerald-100">
                            {t('brief.title')}
                        </CardTitle>
                        <CardDescription className="text-emerald-700/80 dark:text-emerald-300/80">
                            {t('brief.desc')}
                        </CardDescription>
                    </div>
                </div>

                <Button
                    onClick={generateBrief}
                    disabled={isGenerating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shrink-0"
                >
                    {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {t('brief.downloadBtn')}
                </Button>
            </CardContent>
        </Card>
    );
}
