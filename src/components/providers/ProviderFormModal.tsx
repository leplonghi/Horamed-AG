import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
    IconToday as Target, 
    IconArrowRight as NavigationArrow,
    IconSearch,
    IconMapPin,
    IconHeartPulse,
    IconCheck,
    IconClose,
    IconStar
} from "@/components/icons/HoramedIcons";
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  PROVIDER_CATEGORY_LABELS,
  type HealthProvider,
  type OsmSearchResult,
  type ProviderCategory,
} from '@/types/healthProvider';
import { reverseGeocode } from '@/services/osmPlacesService';
import { useToast } from '@/hooks/use-toast';
import { ProviderSearchBar } from './ProviderSearchBar';
import { ScrollArea } from "@/components/ui/scroll-area";

type FormData = Omit<HealthProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface ProviderFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: FormData) => Promise<void>;
  onUpdate: (id: string, data: Partial<FormData>) => Promise<void>;
  editing?: HealthProvider | null;
}

const CATEGORIES: ProviderCategory[] = [
  'doctor', 'clinic', 'hospital', 'lab', 'pharmacy', 'dentist', 'other',
];

function defaultForm(): FormData {
  return {
    name: '',
    category: 'clinic',
    specialty: '',
    doctorName: '',
    document: '',
    phone: '',
    whatsapp: '',
    bookingUrl: '',
    website: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    notes: '',
    isFavorite: false,
  };
}

export function ProviderFormModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  editing,
}: ProviderFormModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(editing);
  const [form, setForm]         = useState<FormData>(defaultForm());
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(!isEditing);

  useEffect(() => {
    if (editing) {
      const { id, userId, createdAt, updatedAt, ...rest } = editing;
      setForm({ ...defaultForm(), ...rest });
      setShowSearch(false);
    } else {
      setForm(defaultForm());
      setShowSearch(true);
    }
    setError(null);
  }, [editing, open]);

  const patch = (key: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleOsmSelect = (result: OsmSearchResult) => {
    setForm(prev => ({
        ...prev,
        name:     result.name,
        category: result.category,
        address:  result.address,
        city:     result.city,
        state:    result.state,
        phone:    result.phone ?? '',
        website:  result.website ?? '',
        osmId:    result.osmId,
        lat:      result.lat,
        lng:      result.lng,
    }));
    setShowSearch(false);
  };

  const handleCepChange = async (cepValue: string) => {
    patch('cep', cepValue);
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            address: `${data.logradouro}${data.bairro ? ` - ${data.bairro}` : ''}`,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
      }
    }
  };

  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Erro', description: 'Geolocalização não suportada no seu navegador.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addressData = await reverseGeocode(latitude, longitude);
        setForm(prev => ({ ...prev, ...addressData, lat: latitude, lng: longitude }));
        setLoading(false);
        toast({ title: 'Sucesso', description: 'Localização obtida!' });
      },
      (err) => {
        setLoading(false);
        toast({ title: 'Erro', description: 'Verifique as permissões de GPS.', variant: 'destructive' });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Informe o nome do provedor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditing && editing) {
        await onUpdate(editing.id, form);
      } else {
        await onCreate(form);
      }
      onClose();
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-sm:w-[96vw] max-sm:rounded-[2.5rem] sm:max-w-xl p-0 overflow-hidden border-0 bg-background/80 backdrop-blur-3xl shadow-2xl"
      >
        <div className="bg-primary/5 p-6 pb-4 border-b border-border/10">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-glow">
                        <IconMapPin size={22} strokeWidth={2.5} />
                    </div>
                    {isEditing ? 'Editar Local' : 'Novo Local de Saúde'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seus médicos, clínicas e hospitais favoritos.
                </p>
            </DialogHeader>
        </div>

        <ScrollArea className="max-h-[70vh]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {!isEditing && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-black uppercase text-primary/70 tracking-widest">
                                Busca Inteligente
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] font-bold rounded-full px-3 bg-primary/5 text-primary hover:bg-primary/10"
                                onClick={() => setShowSearch(v => !v)}
                            >
                                {showSearch ? 'Preencher Manual' : 'Buscar Online'}
                            </Button>
                        </div>

                        {showSearch && (
                            <div className="bg-primary/5 p-1 rounded-2xl border border-primary/10 shadow-inner-light">
                                <ProviderSearchBar onSelect={handleOsmSelect} className="border-0 bg-transparent shadow-none" />
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold ml-1">Tipo</Label>
                            <Select
                                value={form.category}
                                onValueChange={v => patch('category', v as ProviderCategory)}
                            >
                                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/10">
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat} className="rounded-xl">
                                            {PROVIDER_CATEGORY_LABELS[cat]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold ml-1">Nome *</Label>
                            <Input
                                value={form.name}
                                onChange={e => patch('name', e.target.value)}
                                placeholder="Ex: Clínica São Lucas"
                                className="h-12 rounded-2xl bg-muted/30 border-border/10 focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    {(form.category === 'doctor' || form.category === 'clinic') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold ml-1">Médico / Dr(a)</Label>
                                <Input
                                    value={form.doctorName ?? ''}
                                    onChange={e => patch('doctorName', e.target.value)}
                                    placeholder="Nome do profissional"
                                    className="h-12 rounded-2xl bg-muted/30 border-border/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold ml-1">Especialidade</Label>
                                <Input
                                    value={form.specialty ?? ''}
                                    onChange={e => patch('specialty', e.target.value)}
                                    placeholder="Ex: Cardiologia"
                                    className="h-12 rounded-2xl bg-muted/30 border-border/10"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-primary/70 tracking-widest block">
                        Contato e Localização
                    </Label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold ml-1">Telefone</Label>
                            <Input
                                type="tel"
                                value={form.phone ?? ''}
                                onChange={e => patch('phone', e.target.value)}
                                placeholder="(11) 9...."
                                className="h-12 rounded-2xl bg-muted/30 border-border/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold ml-1">WhatsApp</Label>
                            <Input
                                type="tel"
                                value={form.whatsapp ?? ''}
                                onChange={e => patch('whatsapp', e.target.value)}
                                placeholder="Opcional"
                                className="h-12 rounded-2xl bg-muted/30 border-border/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold ml-1">Endereço Completo</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-black uppercase gap-1 px-3 rounded-full text-primary hover:bg-primary/10"
                                onClick={handleGpsLocation}
                            >
                                <Target size={14} className="animate-pulse" />
                                Usar GPS
                            </Button>
                        </div>
                        
                        <div className="flex gap-2">
                            <Input
                                value={form.cep ?? ''}
                                onChange={e => handleCepChange(e.target.value)}
                                placeholder="00000-000"
                                maxLength={9}
                                className="h-12 w-32 rounded-2xl bg-muted/30 border-border/10 text-center"
                            />
                            <Input
                                value={form.address ?? ''}
                                onChange={e => patch('address', e.target.value)}
                                placeholder="Rua, número, complemento..."
                                className="h-12 flex-1 rounded-2xl bg-muted/30 border-border/10"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-xs font-bold ml-1">Observações Pessoais</Label>
                    <Textarea
                        value={form.notes ?? ''}
                        onChange={e => patch('notes', e.target.value)}
                        placeholder="Horários, pontos de referência, etc..."
                        className="min-h-[100px] rounded-2xl bg-muted/30 border-border/10 resize-none"
                    />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <IconStar size={16} weight={form.isFavorite ? "fill" : "regular"} />
                        </div>
                        <Label htmlFor="provider-favorite" className="font-bold cursor-pointer">
                            Provedor Favorito
                        </Label>
                    </div>
                    <Switch
                        id="provider-favorite"
                        checked={form.isFavorite}
                        onCheckedChange={v => patch('isFavorite', v)}
                    />
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold flex items-center gap-2">
                        <IconHeartPulse size={16} className="rotate-45" />
                        {error}
                    </div>
                )}
            </form>
        </ScrollArea>

        <DialogFooter className="p-6 bg-muted/5 border-t border-border/10">
          <div className="flex w-full gap-3">
            <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="flex-1 h-12 rounded-2xl font-bold border-border/20 shadow-sm"
            >
                Cancelar
            </Button>
            <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading} 
                className="flex-[2] h-12 rounded-2xl font-bold bg-primary shadow-glow hover:bg-primary/90 text-white"
            >
                {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Local'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
