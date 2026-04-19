import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDocument } from "@/integrations/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconMedications as Pill,
  IconCalendar as Calendar,
  IconShield as Shield,
  IconActivity as Activity,
} from "@/components/icons/HoramedIcons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { safeDateParse } from "@/lib/safeDateUtils";

interface SharedHistoryPayload {
  ownerName: string;
  sharedAt: string;
  expiresAt?: string;
  medications?: Array<{ name: string; dosage: string; frequency: string }>;
  recentDoses?: Array<{ medicationName: string; takenAt: string; status: string }>;
  profileName?: string;
}

export default function HistoricoCompartilhado() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SharedHistoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "expired" | null>(null);

  useEffect(() => {
    if (!token) { setError("not_found"); setLoading(false); return; }
    loadSharedHistory(token);
  }, [token]);

  const loadSharedHistory = async (tok: string) => {
    try {
      const { data: payload, error: fetchErr } = await fetchDocument<SharedHistoryPayload>(
        "shared_history",
        tok
      );
      if (fetchErr || !payload) { setError("not_found"); return; }
      if (payload.expiresAt) {
        const expires = safeDateParse(payload.expiresAt);
        if (expires && expires < new Date()) { setError("expired"); return; }
      }
      setData(payload);
    } catch {
      setError("not_found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center rounded-2xl border-border/60">
          <CardContent className="pt-10 pb-8 px-6">
            <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {error === "expired" ? "Link expirado" : "Link inválido"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {error === "expired"
                ? "Este link de compartilhamento já expirou. Solicite um novo link ao paciente."
                : "Este link de compartilhamento não existe ou foi removido."}
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">
              Ir para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-8 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 opacity-80" />
            <span className="text-sm font-medium opacity-90">HoraMed · Histórico Compartilhado</span>
          </div>
          <h1 className="text-2xl font-bold">{data?.ownerName || "Paciente"}</h1>
          {data?.profileName && (
            <Badge className="mt-1 bg-white/20 border-0 text-white text-xs">
              Perfil: {data.profileName}
            </Badge>
          )}
          {data?.sharedAt && (
            <p className="text-sm opacity-75 mt-2">
              Compartilhado em{" "}
              {format(new Date(data.sharedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Medicamentos em uso */}
        {data?.medications && data.medications.length > 0 && (
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 font-semibold">
                <Pill className="h-5 w-5 text-teal-500" />
                Medicamentos em uso
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.medications.map((med, i) => (
                <div key={i} className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Doses recentes */}
        {data?.recentDoses && data.recentDoses.length > 0 && (
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 font-semibold">
                <Activity className="h-5 w-5 text-emerald-500" />
                Doses recentes
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentDoses.map((dose, i) => {
                const parsedDate = safeDateParse(dose.takenAt);
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{dose.medicationName}</p>
                        <p className="text-xs text-muted-foreground">
                          {parsedDate ? format(parsedDate, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={dose.status === "taken" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {dose.status === "taken" ? "Tomada" : dose.status === "skipped" ? "Pulada" : dose.status}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Rodapé */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Dados compartilhados pelo próprio paciente via HoraMed.
          {data?.expiresAt && (
            <> Expira em{" "}
              {format(new Date(data.expiresAt), "dd/MM/yyyy", { locale: ptBR })}.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
