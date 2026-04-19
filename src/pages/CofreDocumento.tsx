import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IconArrowLeft as ArrowLeft,
  IconShareNetwork as Share2,
  IconDownload as Download,
  IconTrash as Trash2,
  IconCalendar as Calendar,
  IconPencil as Edit,
  IconPill as Pill,
  IconHealth as Stethoscope,
  IconHealth,
  IconTestTube as TestTube2,
  IconSyringe as Syringe,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconExternalLink as ExternalLink,
  IconCheckCircle as CheckCircle2,
  IconShield as ShieldCheck,
  IconUser,
  IconAlertCircle
} from "@/components/icons/HoramedIcons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useDocumento, useCompartilhamentos, useDeletarDocumento } from "@/hooks/useCofre";
import { auth, storage, functions, fetchCollection, updateDocument } from "@/integrations/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { format, isBefore, differenceInDays, parseISO } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { toast } from "sonner";
import Header from "@/components/Header";
import UpgradeModal from "@/components/UpgradeModal";
import { PrescriptionStatusBadge } from "@/components/PrescriptionStatusBadge";
import { MedicationQuickAddCard } from "@/components/MedicationQuickAddCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import ExamDeficiencyBadges from "@/components/fitness/ExamDeficiencyBadges";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";
import OceanBackground from "@/components/ui/OceanBackground";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import { motion, AnimatePresence } from "framer-motion";
import { cn, pressable } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CofreDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    prescriptions: true,
    exam: true,
    consultation: true,
    vaccine: true,
  });

  const { data: documento, isLoading } = useDocumento(id);
  const { data: compartilhamentos } = useCompartilhamentos(id);
  const { mutate: deletar } = useDeletarDocumento();

  // Buscar medicamentos já adicionados pelo usuário
  const { data: existingMedications = [] } = useQuery({
    queryKey: ["existing-medications", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const { data, error } = await fetchCollection(`users/${user.uid}/medications`);

      if (error) throw error;
      return data.map((item: any) => item.name.toLowerCase().trim());
    },
    enabled: !!user?.uid,
  });

  // Função para verificar se um medicamento já foi adicionado
  const isMedicationAdded = (medicationName: string) => {
    const normalizedName = medicationName.toLowerCase().trim();
    return existingMedications.some((existingName: string) =>
      existingName === normalizedName ||
      existingName.includes(normalizedName) ||
      normalizedName.includes(existingName)
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getCategoryConfig = (categorySlug?: string) => {
    switch (categorySlug) {
      case "receita":
        return { icon: Pill, color: "text-blue-500", bg: "bg-blue-500/10", label: t('cofreDoc.prescription') };
      case "exame":
        return { icon: TestTube2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: t('cofreDoc.exam') };
      case "vacinacao":
        return { icon: Syringe, color: "text-amber-500", bg: "bg-amber-500/10", label: t('cofreDoc.vaccineCard') };
      case "consulta":
        return { icon: Stethoscope, color: "text-rose-500", bg: "bg-rose-500/10", label: t('cofreDoc.consultation') };
      default:
        return { icon: Calendar, color: "text-muted-foreground", bg: "bg-muted/10", label: t('cofreDoc.document') };
    }
  };

  useEffect(() => {
    const loadUrl = async () => {
      if (documento?.filePath) {
        try {
          const fileRef = ref(storage, documento.filePath);
          const url = await getDownloadURL(fileRef);
          setSignedUrl(url);
        } catch (error) {
          console.error("Error loading file URL:", error);
        }
      }
    };
    loadUrl();

    // Carregar status de compra
    if (documento?.meta) {
      setIsPurchased((documento.meta as any)?.isPurchased === true);
    }
  }, [documento]);

  const handleCompartilhar = async () => {
    try {
      const generateShareLink = httpsCallable(functions, "generateShareLink");
      const result = await generateShareLink({
        documentId: id,
        allowDownload: true,
        ttlHours: 72
      });

      const data = result.data as any;

      if (data?.requiresUpgrade) {
        setShowUpgrade(true);
        return;
      }

      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success(t('cofreDoc.linkCopied'));
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(t('cofreDoc.shareError'));
    }
  };

  const handleTogglePurchased = async (checked: boolean) => {
    if (!id || !user?.uid) return;

    try {
      const currentMeta = documento?.meta || {};
      const updatedMeta = { ...currentMeta, isPurchased: checked };

      const { error } = await updateDocument(
        `users/${user.uid}/healthDocuments`,
        id,
        { meta: updatedMeta, updatedAt: new Date().toISOString() }
      );

      if (error) throw error;

      setIsPurchased(checked);
      toast.success(checked ? t('cofreDoc.usedStatus') : t('cofreDoc.statusUpdated'));
    } catch (error) {
      console.error("Error updating prescription status:", error);
      toast.error(t('cofreDoc.deleteError'));
    }
  };

  const handleDeletar = async () => {
    try {
      deletar(id!);
      navigate("/carteira");
    } catch (error) {
      toast.error(t('cofreDoc.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-6 pt-24">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <p>{t('cofreDoc.notFound')}</p>
        </div>
      </div>
    );
  }

  const categoryConfig = getCategoryConfig(documento?.categorySlug);
  const CategoryIcon = categoryConfig.icon;
  const meta = documento?.meta as any;

  // Função para extrair número da quantidade da embalagem
  const extractQuantity = (packageQuantity: string): number | null => {
    if (!packageQuantity) return null;
    const match = packageQuantity.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  // Calcular total de unidades
  const calculateTotalUnits = (packagesCount: number | undefined, packageQuantity: string | undefined): number | null => {
    if (!packagesCount || !packageQuantity) return null;
    const quantity = extractQuantity(packageQuantity);
    return quantity ? packagesCount * quantity : null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <OceanBackground variant="page" />
      <Header />

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            onClick={() => navigate("/carteira")}
            className="mb-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/40"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('cofreDoc.back')}
          </Button>
        </motion.div>

        {/* Hero Header component updated style */}
        <PageHeroHeader
          icon={
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", categoryConfig.bg)}>
              <CategoryIcon className={cn("w-9 h-9", categoryConfig.color)} />
            </div>
          }
          title={documento.title || t('cofreDoc.noTitle')}
          subtitle={documento.profileName ? `${t('cofreDoc.profile')}: ${documento.profileName}` : categoryConfig.label}
          badge={categoryConfig.label}
        />

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {/* Main Info Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[2rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-6">
                  {/* Dados do Paciente */}
                  {(meta?.patient_name || meta?.patient_age || meta?.patient_cpf) && (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <IconUser className="w-4 h-4 text-primary" /> {t('cofreDoc.patientData')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {meta.patient_name && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.name')}</p>
                            <p className="font-bold text-base">{meta.patient_name}</p>
                          </div>
                        )}
                        {meta.patient_age && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.age')}</p>
                            <p className="font-bold">{meta.patient_age}</p>
                          </div>
                        )}
                        {meta.patient_cpf && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.cpf')}</p>
                            <p className="font-bold">{meta.patient_cpf}</p>
                          </div>
                        )}
                        {meta.patient_address && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.address')}</p>
                            <p className="font-bold text-sm leading-relaxed">{meta.patient_address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Identificação do Emitente */}
                  {(meta?.emitter_name || meta?.emitter_address || documento.provider) && (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <IconHealth className="w-4 h-4 text-emerald-500" /> {t('cofreDoc.emitter')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(meta?.emitter_name || documento.provider) && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.name')}</p>
                            <p className="font-bold text-base">{meta?.emitter_name || documento.provider}</p>
                          </div>
                        )}
                        {meta?.emitter_cnpj && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.cnpj')}</p>
                            <p className="font-bold">{meta.emitter_cnpj}</p>
                          </div>
                        )}
                        {meta?.emitter_address && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.address')}</p>
                            <p className="font-bold text-sm leading-relaxed">{meta.emitter_address}</p>
                          </div>
                        )}
                        {(meta?.emitter_city || meta?.emitter_state) && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.cityState')}</p>
                            <p className="font-bold">
                              {[meta?.emitter_city, meta?.emitter_state].filter(Boolean).join(' - ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dados do Médico */}
                  {meta?.doctor_name && (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-blue-500" /> {t('cofreDoc.doctorData')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.name')}</p>
                          <p className="font-bold text-base">{meta.doctor_name}</p>
                        </div>
                        {meta?.doctor_registration && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.doctorCRM')}</p>
                            <p className="font-bold">
                              {meta.doctor_registration}
                              {meta.doctor_state && ` - ${meta.doctor_state}`}
                            </p>
                          </div>
                        )}
                        {meta?.specialty && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{t('cofreDoc.specialty')}</p>
                            <p className="font-bold">{meta.specialty}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Informações Gerais Grid */}
                  <div className="grid grid-cols-2 gap-6 px-1">
                    {documento.issuedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('cofreDoc.issueDate')}</p>
                        <p className="font-bold text-lg">
                          {format(safeDateParse(documento.issuedAt), "dd/MM/yyyy", { locale: dateLocale })}
                        </p>
                      </div>
                    )}
                    {documento.expiresAt && (
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('cofreDoc.validity')}</p>
                        <p className="font-bold text-lg text-rose-500">
                          {format(safeDateParse(documento.expiresAt), "dd/MM/yyyy", { locale: dateLocale })}
                        </p>
                      </div>
                    )}
                    {meta?.prescription_type && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('cofreDoc.prescriptionType')}</p>
                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-white/5 border-white/10 text-sm font-bold capitalize">
                          {meta.prescription_type}
                        </Badge>
                      </div>
                    )}
                    {meta?.diagnosis && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('cofreDoc.diagnosis')}</p>
                        <p className="font-medium bg-white/5 p-4 rounded-xl border border-white/10 leading-relaxed italic">
                          "{meta.diagnosis}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status da Receita */}
                  {documento?.categorySlug === 'receita' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Separator className="bg-white/10 my-4" />
                      <div className="space-y-4 pt-2">
                        <PrescriptionStatusBadge
                          status={
                            !documento.expiresAt ? 'valid' :
                              isBefore(parseISO(documento.expiresAt), new Date()) ? 'expired' :
                                differenceInDays(parseISO(documento.expiresAt), new Date()) <= 7 ? 'expiring_soon' :
                                  'valid'
                          }
                          daysUntilExpiry={documento.expiresAt ? differenceInDays(parseISO(documento.expiresAt), new Date()) : undefined}
                          isPurchased={isPurchased}
                        />

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner-light">
                          <div className="space-y-1">
                            <Label htmlFor="purchased-switch" className="text-base font-bold cursor-pointer">
                              {t('cofreDoc.prescriptionUsedLabel')}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {t('cofreDoc.prescriptionUsedHint')}
                            </p>
                          </div>
                          <Switch
                            id="purchased-switch"
                            checked={isPurchased}
                            onCheckedChange={handleTogglePurchased}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>

                        {!isPurchased && documento.expiresAt && isBefore(parseISO(documento.expiresAt), new Date()) && (
                          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                            <p className="text-sm text-rose-500 font-bold mb-1 flex items-center gap-2">
                              <IconAlertCircle className="w-4 h-4" /> {t('cofreDoc.prescriptionExpired')}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t('cofreDoc.prescriptionExpiredDesc')}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {documento.notes && (
                  <div className="pt-2">
                    <Separator className="bg-white/10 mb-4" />
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">📝 {t('cofreDoc.notes')}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{documento.notes}</p>
                  </div>
                )}

                <div className="pt-4 flex flex-wrap gap-2">
                  <Button onClick={() => navigate(`/carteira/${id}/editar`)} variant="outline" size="lg" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm h-12 flex-1 sm:flex-none">
                    <Edit className="w-4 h-4 mr-2" />
                    {t('cofreDoc.edit')}
                  </Button>
                  <Button onClick={handleCompartilhar} variant="outline" size="lg" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm h-12 flex-1 sm:flex-none">
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('cofreDoc.shareLink')}
                  </Button>
                  {signedUrl && (
                    <Button asChild variant="outline" size="lg" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm h-12 flex-1 sm:flex-none">
                      <a href={signedUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        {t('common.download')}
                      </a>
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="ghost"
                    size="lg"
                    className="rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-12 ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('cofreDoc.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Extracted Data Sections with Premium Design */}
          {meta?.prescriptions && meta.prescriptions.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden">
                <Collapsible open={expandedSections.prescriptions} onOpenChange={() => toggleSection('prescriptions')}>
                  <CollapsibleTrigger asChild>
                    <div {...pressable(() => toggleSection('prescriptions'))} className="p-6 cursor-pointer focus-visible:bg-white/5 outline-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[1.25rem] bg-blue-500/10 flex items-center justify-center">
                            <Pill className="w-5 h-5 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-bold">{t('cofreDoc.prescribedMeds')}</h3>
                          <Badge className="rounded-lg bg-blue-500/20 text-blue-500 border-0 font-bold">{meta.prescriptions.length}</Badge>
                        </div>
                        <div className={cn("transition-transform duration-200", expandedSections.prescriptions ? "rotate-180" : "")}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6 space-y-4">
                      {/* Quick Add Action */}
                      <MedicationQuickAddCard
                        prescriptionId={id}
                        medications={meta.prescriptions}
                        existingMedications={existingMedications}
                      />

                      <div className="grid gap-4">
                        {meta.prescriptions.map((med: any, idx: number) => {
                          const medName = med.commercial_name || med.drug_name || med.name;
                          const isAdded = isMedicationAdded(medName);

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={cn(
                                "p-5 rounded-[1.75rem] border transition-all duration-300",
                                isAdded
                                  ? 'bg-emerald-500/5 border-emerald-500/10 opacity-70'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                              )}
                            >
                              {isAdded && (
                                <div className="mb-3 flex items-center gap-2 text-emerald-500">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-xs font-bold uppercase tracking-wider">{t('cofreDoc.addedToRoutine')}</span>
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex-1">
                                  <p className="font-bold text-lg text-foreground">
                                    {med.commercial_name || med.drug_name}
                                  </p>
                                  {med.commercial_name && med.drug_name && (
                                    <p className="text-sm text-muted-foreground font-medium">
                                      {med.drug_name}
                                    </p>
                                  )}
                                </div>
                                {med.is_generic !== undefined && (
                                  <Badge variant="outline" className={cn("rounded-lg border-0 font-bold px-3 py-1", med.is_generic ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground")}>
                                    {med.is_generic ? `${t('cofreDoc.generic')}` : t('cofreDoc.brand')}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                {med.dose && (
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('cofreDoc.dose')}</p>
                                    <p className="font-bold">💊 {med.dose}</p>
                                  </div>
                                )}
                                {med.frequency && (
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('cofreDoc.frequency')}</p>
                                    <p className="font-bold">⏰ {med.frequency}</p>
                                  </div>
                                )}
                                {med.duration_days && (
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('cofreDoc.duration')}</p>
                                    <p className="font-bold">📅 {med.duration_days} {t('cofreDoc.days')}</p>
                                  </div>
                                )}
                                {med.packages_count && (
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estoque</p>
                                    <p className="font-bold text-emerald-500">📦 {med.packages_count} unid.</p>
                                  </div>
                                )}
                                {med.instructions && (
                                  <div className="col-span-2 mt-2 pt-3 border-t border-white/5 italic text-muted-foreground text-xs leading-relaxed">
                                    "{med.instructions}"
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      <Button
                        variant="ghost"
                        className="w-full h-12 rounded-[1.25rem] bg-white/5 hover:bg-white/10 text-primary font-bold"
                        onClick={() => navigate('/rotina')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t('cofreDoc.viewInRoutine')}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.div>
          )}

          {meta?.extracted_values && meta.extracted_values.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden">
                <Collapsible open={expandedSections.exam} onOpenChange={() => toggleSection('exam')}>
                  <CollapsibleTrigger asChild>
                    <div {...pressable(() => toggleSection('exam'))} className="p-6 cursor-pointer focus-visible:bg-white/5 outline-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center">
                            <TestTube2 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <h3 className="text-lg font-bold">{t('cofreDoc.examResults')}</h3>
                          <Badge className="rounded-lg bg-emerald-500/20 text-emerald-500 border-0 font-bold">{meta.extracted_values.length}</Badge>
                        </div>
                        <div className={cn("transition-transform duration-200", expandedSections.exam ? "rotate-180" : "")}>
                          <ChevronDown className="w-5 h-5 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6 space-y-4">
                      <ExamDeficiencyBadges examData={meta.extracted_values} />

                      <div className="grid gap-3">
                        {meta.extracted_values.map((val: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 transition-all hover:bg-white/10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-foreground/90">{val.parameter}</p>
                                <p className="text-xl font-bold tracking-tight text-foreground">
                                  {val.value} <span className="text-sm font-medium text-muted-foreground">{val.unit}</span>
                                </p>
                                {val.reference_range && (
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {t('cofreDoc.reference')}: {val.reference_range}
                                  </p>
                                )}
                              </div>
                              {val.status && (
                                <Badge
                                  className={cn(
                                    "rounded-lg border-0 px-3 py-1 font-bold shadow-sm",
                                    val.status === 'normal'
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-rose-500/10 text-rose-500 shadow-glow-sm"
                                  )}
                                >
                                  {val.status === 'normal' ? `✓ ${t('cofreDoc.normalValue')}` : `⚠️ ${t('cofreDoc.alteredValue')}`}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.div>
          )}

          {/* Additional details sections simplified with premium touch */}
          {(meta?.vaccine_name || meta?.diagnosis || meta?.specialty) && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meta?.vaccine_name && (
                <Card className="rounded-3xl border-0 bg-card/40 backdrop-blur-xl shadow-glass">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[1rem] bg-amber-500/10 flex items-center justify-center">
                        <Syringe className="w-5 h-5 text-amber-500" />
                      </div>
                      <CardTitle className="text-base font-bold">{t('cofreDoc.vaccineInfo')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="font-bold text-lg text-foreground/90">{meta.vaccine_name}</p>
                      {meta.dose_number && (
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">
                          {t('cofreDoc.dose')}: {meta.dose_number}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(meta?.diagnosis || meta?.specialty) && (
                <Card className="rounded-3xl border-0 bg-card/40 backdrop-blur-xl shadow-glass">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[1rem] bg-rose-500/10 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-rose-500" />
                      </div>
                      <CardTitle className="text-base font-bold">{t('cofreDoc.consultationDetails')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 space-y-4">
                    {meta.specialty && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('cofreDoc.specialty')}</p>
                        <p className="font-bold text-lg">{meta.specialty}</p>
                      </div>
                    )}
                    {meta.diagnosis && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('cofreDoc.diagnosisEval')}</p>
                        <p className="text-sm italic text-foreground/80 leading-relaxed font-medium">"{meta.diagnosis}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* File Preview with premium Frame */}
          {signedUrl && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden">
                <CardContent className="p-3">
                  <div className="rounded-[1.75rem] overflow-hidden bg-black/10 border border-white/5 relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                    {documento.mimeType === "application/pdf" ? (
                      <iframe src={signedUrl} className="w-full h-[600px] border-0" title="PDF Preview" />
                    ) : (
                      <img src={signedUrl} alt={documento.title || ""} className="w-full h-auto max-h-[800px] object-contain mx-auto" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2rem] border-0 bg-card/80 backdrop-blur-2xl shadow-glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">{t('cofreDoc.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              {t('cofreDoc.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="rounded-2xl bg-rose-500 text-white hover:bg-rose-600 border-0 shadow-glow-sm">
              {t('cofreDoc.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
