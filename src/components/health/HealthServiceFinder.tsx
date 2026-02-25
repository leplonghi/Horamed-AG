
import { useState } from "react";
import { MapPin, Search, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

type ServiceType = 'pharmacy' | 'hospital' | 'lab';

interface HealthServiceFinderProps {
    type?: ServiceType;
    className?: string;
    compact?: boolean;
}

export default function HealthServiceFinder({ type = 'pharmacy', className, compact = false }: HealthServiceFinderProps) {
    const { activeProfile } = useUserProfiles();
    const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();
    const { t } = useTranslation();

    const [selectedPlanId, setSelectedPlanId] = useState<string>('none');
    const [serviceType, setServiceType] = useState<ServiceType>(type);

    const plans = activeProfile?.healthPlans || [];

    const handleSearch = () => {
        let query = "";

        // Base term
        switch (serviceType) {
            case 'pharmacy': query = "Farmácia"; break;
            case 'lab': query = "Laboratório exames"; break;
            case 'hospital': query = "Hospital Clínica"; break;
        }

        // Add Plan info
        if (selectedPlanId !== 'none') {
            const plan = plans.find(p => p.id === selectedPlanId);
            if (plan) {
                query += ` que aceita ${plan.operatorName}`;
            }
        }

        // Construct URL
        // If we have coordinates, order by distance around that point
        // Google Maps Universal Link
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

        // Note: 'near me' usually uses the device's current location from GPS automatically when opened in the app.
        // If we want to be specific or if we were on web:
        if (latitude && longitude) {
            // We can hint the location, but 'near me' + query is usually best handled by the app
            // url += `&center=${latitude},${longitude}`;
        } else if (geoError) {
            // If GPS failed, we rely on Google's IP detection or cached location
            // toast.warning("GPS indisponível, usando localização aproximada");
        }

        window.open(url, '_blank');
    };

    if (compact) {
        return (
            <Button variant="outline" size="sm" className="gap-2 w-full" onClick={handleSearch}>
                <MapPin className="h-4 w-4 text-primary" />
                {t('common.findNearby') || "Encontrar Próximo"}
            </Button>
        );
    }

    return (
        <Card className={`p-4 bg-gradient-to-br from-card to-muted/20 ${className}`}>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                        <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{t('healthFinder.title') || "Encontrar Locais Próximos"}</h3>
                        <p className="text-xs text-muted-foreground">{t('healthFinder.subtitle') || "Farmácias, Clínicas e Laboratórios"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('healthFinder.serviceType') || "O que você procura?"}</Label>
                        <Select value={serviceType} onValueChange={(v: ServiceType) => setServiceType(v)}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pharmacy">{t('healthFinder.pharmacy') || "Farmácia"}</SelectItem>
                                <SelectItem value="lab">{t('healthFinder.lab') || "Laboratório"}</SelectItem>
                                <SelectItem value="hospital">{t('healthFinder.hospital') || "Hospital/Clínica"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('healthFinder.usePlan') || "Usar Convênio"}</Label>
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={plans.length === 0}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={plans.length === 0 ? (t('healthFinder.noPlans') || "Sem planos") : "Selecione..."} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('common.none') || "Nenhum / Particular"}</SelectItem>
                                {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.operatorName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button
                    onClick={handleSearch}
                    className="w-full gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={geoLoading}
                >
                    {geoLoading ? (
                        <span className="animate-pulse">Localizando...</span>
                    ) : (
                        <>
                            <Navigation className="h-4 w-4" />
                            {t('common.searchOnMaps') || "Buscar no Google Maps"}
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
}
