import { useState, useEffect } from "react";
import { auth, fetchCollection, addDocument, updateDocument, where, orderBy } from "@/integrations/firebase";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Stethoscope,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format, isFuture, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useTranslation } from "@/contexts/LanguageContext";
interface Consulta {
  id: string;
  specialty: string;
  doctorName: string;
  location: string;
  date: string;
  reason?: string;
  notes?: string;
  status: 'agendada' | 'realizada' | 'cancelada';
}

export default function MedicalAppointments() {
  const { t } = useTranslation();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    specialty: '',
    doctorName: '',
    location: '',
    date: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data } = await fetchCollection<any>(
        `users/${user.uid}/appointments`,
        [orderBy("date", "asc")]
      );

      setConsultas((data || []) as Consulta[]);
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
      toast.error(t("toast.medical.appointmentsError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) return;

      const { error } = await addDocument(`users/${user.uid}/appointments`, {
        userId: user.uid,
        ...formData,
        status: 'agendada'
      });

      if (error) throw error;

      toast.success(t("toast.medical.appointmentScheduled"));
      setDialogOpen(false);
      setFormData({
        specialty: '',
        doctorName: '',
        location: '',
        date: '',
        reason: '',
        notes: ''
      });
      loadConsultas();
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast.error(t("toast.medical.appointmentError"));
    }
  };

  const updateStatus = async (id: string, status: 'realizada' | 'cancelada') => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { error } = await updateDocument(`users/${user.uid}/appointments`, id, { status });

      if (error) throw error;

      toast.success(status === 'realizada' ? 'Consulta marcada como realizada' : 'Consulta cancelada');
      loadConsultas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error(t("toast.medical.statusError"));
    }
  };

  const getStatusBadge = (consulta: Consulta) => {
    if (consulta.status === 'realizada') {
      return <Badge className="bg-green-500">Realizada</Badge>;
    }
    if (consulta.status === 'cancelada') {
      return <Badge variant="destructive">Cancelada</Badge>;
    }

    const date = new Date(consulta.date);
    if (isToday(date)) {
      return <Badge className="bg-yellow-500">Hoje</Badge>;
    }
    if (isPast(date)) {
      return <Badge variant="outline">Passou</Badge>;
    }
    return <Badge>Agendada</Badge>;
  };

  const consultasPendentes = consultas.filter(c =>
    c.status === 'agendada' && isFuture(new Date(c.date))
  );
  const consultasPassadas = consultas.filter(c =>
    c.status === 'realizada' || c.status === 'cancelada' ||
    (c.status === 'agendada' && isPast(new Date(c.date)))
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-4xl mx-auto p-4 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                Agenda Médica
              </h1>
              <p className="text-muted-foreground">
                Gerencie suas consultas e compromissos
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Consulta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agendar Consulta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="specialty">Especialidade*</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Ex: Cardiologia"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="doctorName">Nome do Médico*</Label>
                    <Input
                      id="doctorName"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      placeholder="Dr(a)..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Data e Hora*</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Local*</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Clínica, hospital..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason">Motivo</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Consulta de rotina, exames..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informações adicionais..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Agendar Consulta
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <>
              {/* Próximas Consultas */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Próximas Consultas ({consultasPendentes.length})
                </h2>

                {consultasPendentes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma consulta agendada</p>
                    </CardContent>
                  </Card>
                ) : (
                  consultasPendentes.map((consulta) => (
                    <Card key={consulta.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">
                                {consulta.specialty}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {consulta.doctorName}
                              </p>
                            </div>
                            {getStatusBadge(consulta)}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(consulta.date), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {consulta.location}
                            </div>
                          </div>

                          {consulta.reason && (
                            <p className="text-sm">
                              <strong>Motivo:</strong> {consulta.reason}
                            </p>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(consulta.id, 'realizada')}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Realizada
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(consulta.id, 'cancelada')}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Histórico */}
              {consultasPassadas.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    Histórico ({consultasPassadas.length})
                  </h2>

                  {consultasPassadas.slice(0, 5).map((consulta) => (
                    <Card key={consulta.id} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{consulta.specialty}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(consulta.date), "dd/MM/yyyy", { locale: ptBR })} - {consulta.doctorName}
                            </p>
                          </div>
                          {getStatusBadge(consulta)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Navigation />
    </>
  );
}
