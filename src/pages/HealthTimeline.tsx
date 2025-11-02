import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  FileText, 
  Pill, 
  Activity, 
  Stethoscope,
  Filter,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  type: 'consulta' | 'exame' | 'medicamento' | 'documento' | 'sinal_vital';
  date: string;
  title: string;
  description: string;
  metadata?: any;
}

export default function HealthTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("todos");

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allEvents: TimelineEvent[] = [];

      // Buscar consultas
      const { data: consultas } = await supabase
        .from("consultas_medicas")
        .select("*")
        .eq("user_id", user.id)
        .order("data_consulta", { ascending: false })
        .limit(50);

      consultas?.forEach(c => {
        allEvents.push({
          id: c.id,
          type: 'consulta',
          date: c.data_consulta,
          title: `Consulta: ${c.especialidade || 'Médica'}`,
          description: `${c.medico_nome || 'Médico'} - ${c.local || 'Local não informado'}`,
          metadata: c
        });
      });

      // Buscar exames
      const { data: exames } = await supabase
        .from("exames_laboratoriais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_exame", { ascending: false })
        .limit(50);

      exames?.forEach(e => {
        allEvents.push({
          id: e.id,
          type: 'exame',
          date: e.data_exame,
          title: `Exame Laboratorial`,
          description: `${e.laboratorio || 'Laboratório'} - ${e.medico_solicitante || 'Médico'}`,
          metadata: e
        });
      });

      // Buscar medicamentos adicionados
      const { data: medicamentos } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      medicamentos?.forEach(m => {
        allEvents.push({
          id: m.id,
          type: 'medicamento',
          date: m.created_at,
          title: `Medicamento: ${m.name}`,
          description: m.dose_text || 'Dose não especificada',
          metadata: m
        });
      });

      // Buscar documentos
      const { data: documentos } = await supabase
        .from("documentos_saude")
        .select("*, categorias_saude(label)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      documentos?.forEach(d => {
        allEvents.push({
          id: d.id,
          type: 'documento',
          date: d.created_at,
          title: d.title || 'Documento',
          description: (d.categorias_saude as any)?.label || 'Documento de saúde',
          metadata: d
        });
      });

      // Buscar sinais vitais
      const { data: sinais } = await supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_medicao", { ascending: false })
        .limit(50);

      sinais?.forEach(s => {
        const valores = [];
        if (s.pressao_sistolica) valores.push(`PA: ${s.pressao_sistolica}/${s.pressao_diastolica}`);
        if (s.glicemia) valores.push(`Glicemia: ${s.glicemia}`);
        if (s.peso_kg) valores.push(`Peso: ${s.peso_kg}kg`);

        allEvents.push({
          id: s.id,
          type: 'sinal_vital',
          date: s.data_medicao,
          title: 'Sinais Vitais',
          description: valores.join(' • '),
          metadata: s
        });
      });

      // Ordenar por data decrescente
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error("Erro ao carregar timeline:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consulta': return <Stethoscope className="h-5 w-5" />;
      case 'exame': return <Activity className="h-5 w-5" />;
      case 'medicamento': return <Pill className="h-5 w-5" />;
      case 'documento': return <FileText className="h-5 w-5" />;
      case 'sinal_vital': return <TrendingUp className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'consulta': return 'bg-blue-500';
      case 'exame': return 'bg-purple-500';
      case 'medicamento': return 'bg-green-500';
      case 'documento': return 'bg-orange-500';
      case 'sinal_vital': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredEvents = filterType === 'todos' 
    ? events 
    : events.filter(e => e.type === filterType);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Linha do Tempo
            </h1>
            <p className="text-muted-foreground">
              Histórico completo da sua saúde em ordem cronológica
            </p>
          </div>

          {/* Filtros */}
          <Tabs value={filterType} onValueChange={setFilterType}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="consulta">Consultas</TabsTrigger>
              <TabsTrigger value="exame">Exames</TabsTrigger>
              <TabsTrigger value="medicamento">Medicamentos</TabsTrigger>
              <TabsTrigger value="documento">Documentos</TabsTrigger>
              <TabsTrigger value="sinal_vital">Sinais Vitais</TabsTrigger>
            </TabsList>

            <TabsContent value={filterType} className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum evento encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                  {/* Events */}
                  <div className="space-y-6">
                    {filteredEvents.map((event, index) => (
                      <div key={event.id} className="relative pl-16">
                        {/* Timeline Dot */}
                        <div className={`absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full ${getEventColor(event.type)} border-4 border-background`} />

                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getEventColor(event.type)} text-white`}>
                                {getEventIcon(event.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-semibold text-foreground">
                                    {event.title}
                                  </h3>
                                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(event.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </time>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>

                                <Badge variant="outline" className="mt-2 text-xs">
                                  {event.type === 'consulta' && 'Consulta'}
                                  {event.type === 'exame' && 'Exame'}
                                  {event.type === 'medicamento' && 'Medicamento'}
                                  {event.type === 'documento' && 'Documento'}
                                  {event.type === 'sinal_vital' && 'Sinais Vitais'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Navigation />
    </>
  );
}
