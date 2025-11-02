import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface Consulta {
  id: string;
  especialidade: string;
  medico_nome: string;
  local: string;
  data_consulta: string;
  motivo?: string;
  observacoes?: string;
  status: 'agendada' | 'realizada' | 'cancelada';
}

export default function MedicalAppointments() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    especialidade: '',
    medico_nome: '',
    local: '',
    data_consulta: '',
    motivo: '',
    observacoes: ''
  });

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("consultas_medicas")
        .select("*")
        .eq("user_id", user.id)
        .order("data_consulta", { ascending: true });

      if (error) throw error;
      setConsultas((data || []) as Consulta[]);
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
      toast.error("Erro ao carregar consultas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("consultas_medicas")
        .insert({
          user_id: user.id,
          ...formData,
          status: 'agendada'
        });

      if (error) throw error;

      toast.success("Consulta agendada com sucesso!");
      setDialogOpen(false);
      setFormData({
        especialidade: '',
        medico_nome: '',
        local: '',
        data_consulta: '',
        motivo: '',
        observacoes: ''
      });
      loadConsultas();
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast.error("Erro ao agendar consulta");
    }
  };

  const updateStatus = async (id: string, status: 'realizada' | 'cancelada') => {
    try {
      const { error } = await supabase
        .from("consultas_medicas")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success(status === 'realizada' ? 'Consulta marcada como realizada' : 'Consulta cancelada');
      loadConsultas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusBadge = (consulta: Consulta) => {
    if (consulta.status === 'realizada') {
      return <Badge className="bg-green-500">Realizada</Badge>;
    }
    if (consulta.status === 'cancelada') {
      return <Badge variant="destructive">Cancelada</Badge>;
    }
    
    const date = new Date(consulta.data_consulta);
    if (isToday(date)) {
      return <Badge className="bg-yellow-500">Hoje</Badge>;
    }
    if (isPast(date)) {
      return <Badge variant="outline">Passou</Badge>;
    }
    return <Badge>Agendada</Badge>;
  };

  const consultasPendentes = consultas.filter(c => 
    c.status === 'agendada' && isFuture(new Date(c.data_consulta))
  );
  const consultasPassadas = consultas.filter(c => 
    c.status === 'realizada' || c.status === 'cancelada' || 
    (c.status === 'agendada' && isPast(new Date(c.data_consulta)))
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
                    <Label htmlFor="especialidade">Especialidade*</Label>
                    <Input
                      id="especialidade"
                      value={formData.especialidade}
                      onChange={(e) => setFormData({...formData, especialidade: e.target.value})}
                      placeholder="Ex: Cardiologia"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="medico_nome">Nome do Médico*</Label>
                    <Input
                      id="medico_nome"
                      value={formData.medico_nome}
                      onChange={(e) => setFormData({...formData, medico_nome: e.target.value})}
                      placeholder="Dr(a)..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_consulta">Data e Hora*</Label>
                    <Input
                      id="data_consulta"
                      type="datetime-local"
                      value={formData.data_consulta}
                      onChange={(e) => setFormData({...formData, data_consulta: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="local">Local*</Label>
                    <Input
                      id="local"
                      value={formData.local}
                      onChange={(e) => setFormData({...formData, local: e.target.value})}
                      placeholder="Clínica, hospital..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivo">Motivo</Label>
                    <Input
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                      placeholder="Consulta de rotina, exames..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
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
                                {consulta.especialidade}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {consulta.medico_nome}
                              </p>
                            </div>
                            {getStatusBadge(consulta)}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(consulta.data_consulta), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {consulta.local}
                            </div>
                          </div>

                          {consulta.motivo && (
                            <p className="text-sm">
                              <strong>Motivo:</strong> {consulta.motivo}
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
                            <h3 className="font-semibold">{consulta.especialidade}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(consulta.data_consulta), "dd/MM/yyyy", { locale: ptBR })} - {consulta.medico_nome}
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
