import { MedicalEventFormData } from '@/types/medicalEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CalendarBlank as CalIcon, MapPin, User, Clock, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

interface StepReviewProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onBack: () => void;
    onSave: () => void;
    isSaving: boolean;
}

const StepReview = ({ formData, updateFormData, onBack, onSave, isSaving }: StepReviewProps) => {

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Revisão Final</h2>
                <p className="text-muted-foreground">Confira os dados antes de salvar.</p>
            </div>

            <Card>
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span>Resumo</span>
                        <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full uppercase">
                            {formData.type === 'consultation' ? 'Consulta' : formData.type === 'exam' ? 'Exame' : formData.type}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="flex items-start gap-3">
                        <CalIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <h4 className="font-medium text-sm">Data e Hora</h4>
                            <p className="text-sm text-muted-foreground">
                                {formData.date?.toLocaleDateString()} às {formData.time}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <h4 className="font-medium text-sm">Local</h4>
                            <p className="text-sm text-muted-foreground">{formData.location?.name}</p>
                            {formData.location?.address && <p className="text-xs text-muted-foreground/80">{formData.location.address}</p>}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <h4 className="font-medium text-sm">Profissional</h4>
                            <p className="text-sm text-muted-foreground">{formData.doctor?.name || 'Não informado'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preparation / Notes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Requer Preparo? (Jejum, etc)
                    </Label>
                    <Switch
                        checked={formData.preparation?.fasting || false}
                        onCheckedChange={(checked) => updateFormData({
                            preparation: {
                                fasting: checked,
                                instructions: formData.preparation?.instructions || []
                            }
                        })}
                    />
                </div>

                {formData.preparation?.fasting && (
                    <div className="pl-6 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-xs mb-1 block">Instruções de Preparo</Label>
                        <Textarea
                            placeholder="Ex: Jejum de 8h, trazer documento..."
                            className="text-sm"
                            value={formData.preparation?.instructions?.join('\n') || ''}
                            onChange={(e) => updateFormData({
                                preparation: {
                                    ...formData.preparation,
                                    fasting: true,
                                    instructions: e.target.value.split('\n')
                                }
                            })}
                        />
                    </div>
                )}
            </div>

            {/* Recurrence Section */}
            <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Repetir Evento?
                    </Label>
                    <Switch
                        checked={formData.recurrence?.enabled || false}
                        onCheckedChange={(checked) => updateFormData({
                            recurrence: {
                                enabled: checked,
                                frequency: 'weekly',
                                interval: 1,
                                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Default 1 month
                            }
                        })}
                    />
                </div>

                {formData.recurrence?.enabled && (
                    <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs mb-1 block">Frequência</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.recurrence.frequency}
                                    onChange={(e) => updateFormData({
                                        recurrence: { ...formData.recurrence!, frequency: e.target.value as any }
                                    })}
                                >
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensal</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs mb-1 block">Repetir até</Label>
                                <Input
                                    type="date"
                                    className="h-10"
                                    value={formData.recurrence.endDate ? formData.recurrence.endDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            updateFormData({
                                                recurrence: { ...formData.recurrence!, endDate: safeDateParse(e.target.value) }
                                            });
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            O evento será repetido a cada {formData.recurrence.interval} {formData.recurrence.frequency === 'weekly' ? 'semana(s)' : formData.recurrence.frequency === 'monthly' ? 'mês(es)' : 'ano(s)'} até a data final.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
                <Label>Ativar Notificações</Label>
                <Switch
                    checked={formData.enableNotifications ?? true}
                    onCheckedChange={(checked) => updateFormData({ enableNotifications: checked })}
                />
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={onBack} className="w-1/3" disabled={isSaving}>
                    Voltar
                </Button>
                <Button onClick={onSave} className="w-2/3" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
                </Button>
            </div>
        </div>
    );
};

export default StepReview;
