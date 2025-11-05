import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { FileText, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "./ui/progress";

interface MonthlyReport {
  month: number;
  year: number;
  totalDoses: number;
  takenDoses: number;
  skippedDoses: number;
  adherenceRate: number;
  previousAdherence: number;
  improvementPercent: number;
  avgDelayMinutes: number;
  medicationBreakdown: Array<{
    name: string;
    adherence: number;
    total: number;
    taken: number;
  }>;
}

export default function MonthlyReportCard() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MonthlyReport | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const { data, error } = await supabase.functions.invoke("generate-monthly-report", {
        body: {
          month: lastMonth.getMonth() + 1,
          year: lastMonth.getFullYear(),
        },
      });

      if (error) throw error;

      if (data.report) {
        setReport(data.report);
        toast.success("Relatório gerado com sucesso!");
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[month - 1];
  };

  if (!report) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Relatório Mensal</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Veja como foi seu mês anterior
            </p>
          </div>
          <Button onClick={generateReport} disabled={loading}>
            {loading ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              Relatório de {getMonthName(report.month)} {report.year}
            </h3>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Progresso Geral</p>
            <p className="text-3xl font-bold text-primary">{report.adherenceRate}%</p>
            <div className="flex items-center gap-1 text-sm">
              {report.improvementPercent >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success">+{report.improvementPercent}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{report.improvementPercent}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-muted">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Doses Tomadas</p>
            <p className="text-3xl font-bold text-foreground">
              {report.takenDoses}/{report.totalDoses}
            </p>
            {report.avgDelayMinutes > 0 && (
              <p className="text-sm text-muted-foreground">
                Atraso médio: {report.avgDelayMinutes} min
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Medication Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Progresso por Medicamento</h4>
        {report.medicationBreakdown.map((med) => (
          <div key={med.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{med.name}</span>
              <span className="text-muted-foreground">
                {med.adherence}% ({med.taken}/{med.total})
              </span>
            </div>
            <Progress value={med.adherence} className="h-2" />
          </div>
        ))}
      </div>

      {/* Insights */}
      <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <div className="space-y-2">
          <p className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Insights do Mês
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
            {report.adherenceRate >= 90 && (
              <li>Excelente! Você manteve um progresso superior a 90%!</li>
            )}
            {report.improvementPercent > 5 && (
              <li>Parabéns! Você melhorou {report.improvementPercent}% comparado ao mês anterior.</li>
            )}
            {report.avgDelayMinutes < 15 && report.avgDelayMinutes > 0 && (
              <li>Ótima pontualidade! Atraso médio de apenas {report.avgDelayMinutes} minutos.</li>
            )}
            {report.skippedDoses === 0 && (
              <li>Perfeito! Você não pulou nenhuma dose este mês.</li>
            )}
          </ul>
        </div>
      </Card>

      <Button variant="outline" onClick={generateReport} className="w-full">
        Gerar Novo Relatório
      </Button>
    </Card>
  );
}
