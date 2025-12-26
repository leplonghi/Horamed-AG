import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Phone, MapPin, Clock, Activity, Lock } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmergencyResponse {
  guidance: string;
  medication: string;
  missedDoses: number;
  timeSinceMissed: string;
  nearbyPharmacies: Array<{
    name: string;
    address: string;
    distance: number;
    phone: string;
    open24h: boolean;
  }>;
  emergencyContacts: Array<{
    name: string;
    phone: string;
  }>;
}

const Emergency = () => {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  const { t } = useLanguage();
  const [medicationName, setMedicationName] = useState("");
  const [missedDoses, setMissedDoses] = useState("1");
  const [timeSinceMissed, setTimeSinceMissed] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<EmergencyResponse | null>(null);

  // Feature flag: emergency desabilitada por padrão
  if (!isEnabled('emergency')) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container mx-auto px-4 py-6 pt-24">
          <div className="max-w-md mx-auto text-center pt-20 space-y-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">{t('emergency.disabled')}</h2>
            <p className="text-muted-foreground">
              {t('emergency.disabledDesc')}
            </p>
            <Button onClick={() => navigate('/hoje')} variant="outline">
              {t('emergency.backToHome')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleEmergency = async () => {
    if (!medicationName.trim() || !timeSinceMissed.trim()) {
      toast.error(t('emergency.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-guidance', {
        body: {
          medicationName: medicationName.trim(),
          missedDoses: parseInt(missedDoses),
          timeSinceMissed: timeSinceMissed.trim(),
          userLocation: null // Em produção, obter geolocalização real
        }
      });

      if (error) throw error;

      setResponse(data);
      toast.success(t('emergency.guidanceObtained'));
    } catch (error) {
      console.error('Error getting emergency guidance:', error);
      toast.error(t('emergency.guidanceError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pt-24 space-y-6">
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-600 font-semibold">
            {t('emergency.alert')}
          </AlertDescription>
        </Alert>

        <div>
          <h1 className="text-3xl font-bold text-red-600">{t('emergency.title')}</h1>
          <p className="text-muted-foreground">{t('emergency.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('emergency.missedDoseInfo')}</CardTitle>
            <CardDescription>{t('emergency.fillData')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('emergency.medication')}</Label>
              <Input
                placeholder={t('emergency.medicationPlaceholder')}
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('emergency.howManyMissed')}</Label>
              <Input
                type="number"
                min="1"
                value={missedDoses}
                onChange={(e) => setMissedDoses(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('emergency.howLongAgo')}</Label>
              <Input
                placeholder={t('emergency.timePlaceholder')}
                value={timeSinceMissed}
                onChange={(e) => setTimeSinceMissed(e.target.value)}
              />
            </div>

            <Button
              onClick={handleEmergency}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              {t('emergency.getGuidance')}
            </Button>
          </CardContent>
        </Card>

        {response && (
          <>
            <Card className="border-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  {t('emergency.guidance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {response.guidance}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  {t('emergency.emergencyContacts')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {response.emergencyContacts.map((contact, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                  >
                    <span>{contact.name}</span>
                    <span className="font-bold">{contact.phone}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t('emergency.nearby24hPharmacies')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.nearbyPharmacies.map((pharmacy, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{pharmacy.name}</h3>
                        <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {pharmacy.distance} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {t('emergency.open24h')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${pharmacy.phone}`, '_self')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t('emergency.call')}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Emergency;