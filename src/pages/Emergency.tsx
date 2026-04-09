import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { functions, httpsCallable, auth, fetchCollection, fetchDocument, where } from "@/integrations/firebase";
import { toast } from "sonner";
import { Warning as AlertTriangle, Phone, MapPin, Clock, Heartbeat as Activity, Lock, FirstAid, Pill, Download, Spinner } from "@phosphor-icons/react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useLanguage } from "@/contexts/LanguageContext";
import { QRCodeSVG } from "qrcode.react";

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

interface EmergencyCardData {
  patientName: string;
  bloodType: string;
  allergies: string;
  medications: Array<{ name: string; dose: string }>;
  emergencyContact: string;
  emergencyPhone: string;
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

  // Emergency Card state
  const [cardData, setCardData] = useState<EmergencyCardData | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
      const emergencyGuidance = httpsCallable(functions, 'emergencyGuidance');
      const { data }: any = await emergencyGuidance({
        medicationName: medicationName.trim(),
        missedDoses: parseInt(missedDoses),
        timeSinceMissed: timeSinceMissed.trim(),
        userLocation: null
      });
      setResponse(data as EmergencyResponse);
      toast.success(t('emergency.guidanceObtained'));
    } catch (error) {
      console.error('Error getting emergency guidance:', error);
      toast.error(t('emergency.guidanceError'));
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyCard = async () => {
    setCardLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) { setCardLoading(false); return; }

      // Load profile
      const { data: profile } = await fetchDocument<any>(`users`, user.uid);

      // Load active medications
      const { data: meds } = await fetchCollection<any>(
        `users/${user.uid}/medications`,
        [where('isActive', '==', true)]
      );

      setCardData({
        patientName: profile?.displayName || profile?.nickname || profile?.full_name || user.email || 'Paciente',
        bloodType: profile?.bloodType || profile?.blood_type || '',
        allergies: profile?.allergies || '',
        medications: (meds || []).slice(0, 8).map((m: any) => ({
          name: m.name,
          dose: m.doseText || m.dose_text || '',
        })),
        emergencyContact: profile?.emergencyContactName || '',
        emergencyPhone: profile?.emergencyContactPhone || '',
      });
    } catch (err) {
      console.error('Error loading emergency card:', err);
      toast.error('Erro ao carregar dados do cartão');
    } finally {
      setCardLoading(false);
    }
  };

  const saveCardAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#fff', scale: 2 });
      const link = document.createElement('a');
      link.download = 'cartao-emergencia-horamend.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // html2canvas not available — fallback: print
      window.print();
    }
  };

  // QR code encodes a small JSON summary
  const qrValue = cardData
    ? JSON.stringify({
        n: cardData.patientName,
        bt: cardData.bloodType,
        al: cardData.allergies,
        m: cardData.medications.map(m => m.name).join(', '),
        ec: cardData.emergencyContact,
        ep: cardData.emergencyPhone,
        src: 'HoraMed',
      })
    : 'HoraMed Emergency Card';

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

        <Tabs defaultValue="guidance">
          <TabsList className="w-full">
            <TabsTrigger value="guidance" className="flex-1">
              <Activity className="h-4 w-4 mr-1.5" />
              Dose Perdida
            </TabsTrigger>
            <TabsTrigger value="card" className="flex-1" onClick={loadEmergencyCard}>
              <FirstAid className="h-4 w-4 mr-1.5" />
              Cartão de Emergência
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Missed dose guidance */}
          <TabsContent value="guidance" className="space-y-4 mt-4">
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
          </TabsContent>

          {/* Tab 2: Offline emergency card */}
          <TabsContent value="card" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Cartão offline com seus medicamentos e dados críticos. Apresente em atendimentos de emergência mesmo sem internet.
            </p>

            {cardLoading && (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!cardLoading && cardData && (
              <>
                {/* Printable card */}
                <div
                  ref={cardRef}
                  className="border-2 border-red-500 rounded-2xl overflow-hidden bg-white"
                >
                  {/* Header bar */}
                  <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FirstAid className="h-5 w-5 text-white" />
                      <span className="text-white font-bold text-sm">CARTÃO DE EMERGÊNCIA — HoraMed</span>
                    </div>
                    {cardData.bloodType && (
                      <span className="bg-white text-red-700 font-black text-sm px-2 py-0.5 rounded">
                        {cardData.bloodType}
                      </span>
                    )}
                  </div>

                  <div className="p-4 grid grid-cols-[1fr_auto] gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Paciente</p>
                        <p className="font-bold text-slate-800">{cardData.patientName}</p>
                      </div>

                      {cardData.allergies && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-red-500">⚠ Alergias</p>
                          <p className="text-sm font-semibold text-red-700">{cardData.allergies}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                          <Pill className="h-3 w-3" /> Medicamentos em uso
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {cardData.medications.map((m, i) => (
                            <li key={i} className="text-xs text-slate-700">
                              • {m.name}{m.dose ? ` — ${m.dose}` : ''}
                            </li>
                          ))}
                          {cardData.medications.length === 0 && (
                            <li className="text-xs text-slate-400">Nenhum medicamento cadastrado</li>
                          )}
                        </ul>
                      </div>

                      {cardData.emergencyContact && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Contato de Emergência</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {cardData.emergencyContact}
                            {cardData.emergencyPhone && ` — ${cardData.emergencyPhone}`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-1">
                      <QRCodeSVG
                        value={qrValue}
                        size={90}
                        level="M"
                        includeMargin
                        bgColor="#ffffff"
                        fgColor="#1e293b"
                      />
                      <p className="text-[9px] text-slate-400 text-center">Escaneie para<br />ver detalhes</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={saveCardAsImage}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Salvar como imagem
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/perfil')}
                  >
                    Editar dados
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Os dados são lidos do seu perfil. Para atualizar alergias e tipo sanguíneo, acesse Perfil → Dados de Saúde.
                </p>
              </>
            )}

            {!cardLoading && !cardData && (
              <Card className="p-6 text-center">
                <FirstAid className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Clique na aba para carregar seus dados de emergência</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Emergency;
