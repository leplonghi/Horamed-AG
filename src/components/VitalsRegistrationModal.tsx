import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDocument, auth } from "@/integrations/firebase";
import { toast } from "sonner";
import { Scale, CalendarIcon, Activity, Heart, Droplets } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export type VitalType = 'weight' | 'pressure' | 'glucose';

interface VitalsRegistrationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileId?: string;
    onSuccess?: () => void;
    defaultTab?: VitalType;
}

export default function VitalsRegistrationModal({
    open,
    onOpenChange,
    profileId,
    onSuccess,
    defaultTab = 'weight',
}: VitalsRegistrationModalProps) {
    const [activeTab, setActiveTab] = useState<VitalType>(defaultTab);
    const { t, language } = useLanguage();
    const dateLocale = language === 'pt' ? ptBR : enUS;

    // States
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState("");

    // Weight State
    const [weight, setWeight] = useState("");

    // Pressure State
    const [systolic, setSystolic] = useState("");
    const [diastolic, setDiastolic] = useState("");

    // Glucose State
    const [glucose, setGlucose] = useState("");
    const [glucoseContext, setGlucoseContext] = useState("fasting"); // fasting, post_prandial, casual

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab, open]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error(t('weightModal.notAuthenticated'));

            const commonData = {
                userId: user.uid,
                profileId: profileId || null,
                notes: notes.trim() || null,
                recordedAt: date.toISOString(),
                createdAt: new Date().toISOString()
            };

            if (activeTab === 'weight') {
                if (!weight || parseFloat(weight) <= 0) {
                    toast.error("Peso inválido");
                    setLoading(false);
                    return;
                }
                await addDocument(profileId ? `users/${user.uid}/profiles/${profileId}/weightLogs` : `users/${user.uid}/weightLogs`, {
                    ...commonData,
                    weightKg: parseFloat(weight)
                });
                toast.success(language === 'pt' ? "Peso registrado!" : "Weight recorded!");
            }
            else if (activeTab === 'pressure') {
                if (!systolic || !diastolic) {
                    toast.error("Preencha sistólica e diastólica");
                    setLoading(false);
                    return;
                }
                await addDocument(profileId ? `users/${user.uid}/profiles/${profileId}/pressureLogs` : `users/${user.uid}/pressureLogs`, {
                    ...commonData,
                    systolic: parseInt(systolic),
                    diastolic: parseInt(diastolic)
                });
                toast.success(language === 'pt' ? "Pressão registrada!" : "Pressure recorded!");
            }
            else if (activeTab === 'glucose') {
                if (!glucose) {
                    toast.error("Preencha o nível de glicose");
                    setLoading(false);
                    return;
                }
                await addDocument(profileId ? `users/${user.uid}/profiles/${profileId}/glucoseLogs` : `users/${user.uid}/glucoseLogs`, {
                    ...commonData,
                    value: parseInt(glucose),
                    context: glucoseContext, // fasting, post_prandial, casual
                    unit: 'mg/dL'
                });
                toast.success(language === 'pt' ? "Glicemia registrada!" : "Glucose recorded!");
            }

            // Reset info
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error("Error saving vital:", error);
            toast.error(language === 'pt' ? "Erro ao salvar" : "Error saving");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setWeight("");
        setSystolic("");
        setDiastolic("");
        setGlucose("");
        setNotes("");
        setDate(new Date());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {language === 'pt' ? 'Registrar Sinais Vitais' : 'Log Vital Signs'}
                    </DialogTitle>
                    <DialogDescription>
                        {language === 'pt'
                            ? 'Acompanhe métricas para ajudar a Clara a monitorar sua saúde.'
                            : 'Track metrics to help Clara monitor your health.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VitalType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="weight" className="gap-2">
                            <Scale className="h-4 w-4" />
                            <span className="hidden sm:inline">{language === 'pt' ? 'Peso' : 'Weight'}</span>
                        </TabsTrigger>
                        <TabsTrigger value="pressure" className="gap-2">
                            <Heart className="h-4 w-4" />
                            <span className="hidden sm:inline">{language === 'pt' ? 'Pressão' : 'BP'}</span>
                        </TabsTrigger>
                        <TabsTrigger value="glucose" className="gap-2">
                            <Droplets className="h-4 w-4" />
                            <span className="hidden sm:inline">{language === 'pt' ? 'Glicose' : 'Glucose'}</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4">
                        {/* Common Date Input */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                {language === 'pt' ? 'Data e Hora' : 'Date & Time'}
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP p", { locale: dateLocale }) : <span>Selecione a data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(newDate) => newDate && setDate(newDate)}
                                        disabled={(date) => date > new Date()}
                                        initialFocus
                                        locale={dateLocale}
                                    />
                                    {/* Time picker could be added here, for now defaulting to current time if just date selected, or strictly date */}
                                </PopoverContent>
                            </Popover>
                        </div>

                        <TabsContent value="weight" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-base font-medium">
                                    {language === 'pt' ? 'Peso (kg)' : 'Weight (kg)'} *
                                </Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="500"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder={t("placeholder.weight")}
                                    className="text-2xl h-14 text-center"
                                    inputMode="decimal"
                                    autoFocus={activeTab === 'weight'}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="pressure" className="space-y-4 mt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="systolic" className="text-base font-medium">
                                        {language === 'pt' ? 'Sistólica (Alta)' : 'Systolic'}
                                    </Label>
                                    <Input
                                        id="systolic"
                                        type="number"
                                        placeholder="120"
                                        value={systolic}
                                        onChange={(e) => setSystolic(e.target.value)}
                                        className="text-xl h-12 text-center"
                                        inputMode="numeric"
                                        autoFocus={activeTab === 'pressure'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="diastolic" className="text-base font-medium">
                                        {language === 'pt' ? 'Diastólica (Baixa)' : 'Diastolic'}
                                    </Label>
                                    <Input
                                        id="diastolic"
                                        type="number"
                                        placeholder="80"
                                        value={diastolic}
                                        onChange={(e) => setDiastolic(e.target.value)}
                                        className="text-xl h-12 text-center"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">mmHg</p>
                        </TabsContent>

                        <TabsContent value="glucose" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="glucose" className="text-base font-medium">
                                    {language === 'pt' ? 'Nível de Glicose' : 'Glucose Level'}
                                </Label>
                                <Input
                                    id="glucose"
                                    type="number"
                                    placeholder={t("placeholder.glucose")}
                                    value={glucose}
                                    onChange={(e) => setGlucose(e.target.value)}
                                    className="text-2xl h-14 text-center"
                                    inputMode="numeric"
                                    autoFocus={activeTab === 'glucose'}
                                />
                                <p className="text-xs text-muted-foreground text-center">mg/dL</p>
                            </div>

                            <div className="space-y-2">
                                <Label>{language === 'pt' ? 'Contexto' : 'Context'}</Label>
                                <Select value={glucoseContext} onValueChange={setGlucoseContext}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fasting">{language === 'pt' ? 'Jejum' : 'Fasting'}</SelectItem>
                                        <SelectItem value="post_prandial">{language === 'pt' ? 'Pós-refeição (2h)' : 'After meal (2h)'}</SelectItem>
                                        <SelectItem value="casual">{language === 'pt' ? 'Casual / Aleatório' : 'Casual / Random'}</SelectItem>
                                        <SelectItem value="pre_sleep">{language === 'pt' ? 'Antes de dormir' : 'Pre-sleep'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm">
                                {language === 'pt' ? 'Observações (Opcional)' : 'Notes (Optional)'}
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t("placeholder.notes")}
                                rows={2}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            {language === 'pt' ? 'Cancelar' : 'Cancel'}
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="gap-2">
                            <Activity className="h-4 w-4" />
                            {loading
                                ? (language === 'pt' ? 'Salvando...' : 'Saving...')
                                : (language === 'pt' ? 'Salvar Registro' : 'Save Record')}
                        </Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
