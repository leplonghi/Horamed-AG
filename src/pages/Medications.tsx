import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, Plus, Pill, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import FloatingActionButton from "@/components/FloatingActionButton";

interface Item {
  id: string;
  name: string;
  dose_text: string | null;
  category: string;
  is_active: boolean;
  schedules: Array<{
    id: string;
    times: any;
    freq_type: string;
  }>;
  stock?: Array<{
    units_left: number;
    unit_label: string;
  }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  medicamento: "💊",
  vitamina: "🧪",
  suplemento: "🌿",
  outro: "📦",
};

export default function Medications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAddMedication } = useSubscription();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(`
          id,
          name,
          dose_text,
          category,
          is_active,
          schedules (
            id,
            times,
            freq_type
          ),
          stock (
            units_left,
            unit_label
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        stock: item.stock ? (Array.isArray(item.stock) ? item.stock : [item.stock]) : []
      }));
      
      setItems(formattedData);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar medicamentos");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este medicamento?")) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Medicamento excluído");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Erro ao excluir medicamento");
    }
  };

  const getScheduleSummary = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return "Sem horários";
    
    const totalTimes = schedules.reduce((acc, schedule) => {
      const times = Array.isArray(schedule.times) ? schedule.times.length : 0;
      return acc + times;
    }, 0);
    
    return `${totalTimes}x ao dia`;
  };

  const getStockStatus = (stock: any[]) => {
    if (!stock || stock.length === 0) return null;
    
    const unitsLeft = stock[0].units_left;
    const unitLabel = stock[0].unit_label || "un";
    
    if (unitsLeft === 0) return { label: "Sem estoque", color: "destructive" };
    if (unitsLeft <= 5) return { label: `${unitsLeft} ${unitLabel} - Crítico`, color: "destructive" };
    if (unitsLeft <= 15) return { label: `${unitsLeft} ${unitLabel} - Baixo`, color: "warning" };
    return { label: `${unitsLeft} ${unitLabel}`, color: "default" };
  };

  const handleAddClick = () => {
    if (!canAddMedication) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/adicionar");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 p-6 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            <ListSkeleton count={5} />
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meus Medicamentos</h1>
              <p className="text-muted-foreground">
                Gerencie sua rotina de medicamentos
              </p>
            </div>
            <Button onClick={handleAddClick} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Medications List */}
          {filteredItems.length === 0 && searchTerm === "" ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <div className="mb-4 bg-primary/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <Pill className="h-10 w-10 text-primary" />
                </div>
                <p className="text-xl font-semibold mb-2">Nenhum medicamento cadastrado</p>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Adicione medicamentos, vitaminas e suplementos para organizar sua rotina de saúde
                </p>
                <Button onClick={handleAddClick} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Primeiro Medicamento
                </Button>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Nenhum resultado encontrado</p>
                <p className="text-muted-foreground">
                  Tente buscar com outro termo
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.stock);
                
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{CATEGORY_ICONS[item.category] || "📦"}</span>
                            <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                          </div>
                          
                          {item.dose_text && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.dose_text}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              {getScheduleSummary(item.schedules)}
                            </Badge>
                            
                            {stockStatus && (
                              <Badge 
                                variant={stockStatus.color === "destructive" ? "destructive" : "secondary"}
                                className={stockStatus.color === "warning" ? "bg-amber-100 text-amber-700" : ""}
                              >
                                <Package className="h-3 w-3 mr-1" />
                                {stockStatus.label}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/adicionar?edit=${item.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <FloatingActionButton />
      <Navigation />
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="medication"
      />
    </>
  );
}
