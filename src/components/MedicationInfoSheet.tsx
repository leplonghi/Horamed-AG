import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Warning as AlertTriangle, Pill, Tag, FileText, Info, ShieldWarning as ShieldAlert, Heartbeat as Activity, Lightning as Zap, Prohibit as Ban, BookOpen, Globe } from "@phosphor-icons/react";
import { MedicationInfo } from "@/hooks/useMedicationInfo";
import { useAnvisaLookup } from "@/hooks/useAnvisaLookup";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MedicationInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationName: string;
  info: MedicationInfo | null;
  isLoading: boolean;
  error: string | null;
}

export default function MedicationInfoSheet({
  open,
  onOpenChange,
  medicationName,
  info,
  isLoading,
  error,
}: MedicationInfoSheetProps) {
  const { t, language } = useLanguage();
  const { info: anvisaInfo, isLoading: anvisaLoading, lookup } = useAnvisaLookup();

  useEffect(() => {
    if (open && medicationName) lookup(medicationName);
  }, [open, medicationName, lookup]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <SheetHeader className="text-left p-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                {medicationName}
                <Badge variant="secondary" className="text-xs">
                  {language === 'pt' ? 'Bula' : 'Package Insert'}
                </Badge>
              </SheetTitle>
              <SheetDescription>
                {language === 'pt' ? 'Informações sobre o medicamento' : 'Medication information'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6 space-y-4">
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('medInfo.consultProfessional')}
                </p>
              </div>
            )}

            {info && !isLoading && (
              <Accordion type="multiple" defaultValue={["indication", "howToUse"]} className="space-y-2">
                {/* Indication - Para que serve */}
                <AccordionItem value="indication" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-semibold">
                        {language === 'pt' ? 'Para que serve' : 'What is it for'}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {info.indication || info.description || t('medInfo.notAvailable')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Therapeutic Class & Active Ingredient */}
                {(info.therapeuticClass || info.activeIngredient) && (
                  <AccordionItem value="composition" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-primary" />
                        <span className="font-semibold">
                          {language === 'pt' ? 'Composição' : 'Composition'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-3">
                      {info.activeIngredient && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            {language === 'pt' ? 'Princípio Ativo' : 'Active Ingredient'}
                          </p>
                          <p className="text-muted-foreground">{info.activeIngredient}</p>
                        </div>
                      )}
                      {info.therapeuticClass && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            {language === 'pt' ? 'Classe Terapêutica' : 'Therapeutic Class'}
                          </p>
                          <Badge variant="secondary">{info.therapeuticClass}</Badge>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* How to Use - Como usar */}
                {info.howToUse && (
                  <AccordionItem value="howToUse" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">
                          {language === 'pt' ? 'Como usar' : 'How to use'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed">{info.howToUse}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Contraindications - Contraindicações */}
                {info.contraindications && (
                  <AccordionItem value="contraindications" className="border rounded-lg px-4 border-destructive/30">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Ban className="h-5 w-5 text-destructive" />
                        <span className="font-semibold text-destructive">
                          {language === 'pt' ? 'Contraindicações' : 'Contraindications'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed">{info.contraindications}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Side Effects - Efeitos colaterais */}
                {info.sideEffects && (
                  <AccordionItem value="sideEffects" className="border rounded-lg px-4 border-warning/30">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-warning" />
                        <span className="font-semibold">
                          {language === 'pt' ? 'Efeitos colaterais' : 'Side effects'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed">{info.sideEffects}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Warnings - Precauções */}
                {info.warnings && (
                  <AccordionItem value="warnings" className="border rounded-lg px-4 border-warning/30">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <span className="font-semibold">
                          {language === 'pt' ? 'Precauções' : 'Warnings'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed">{info.warnings}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Interactions - Interações */}
                {info.interactions && (
                  <AccordionItem value="interactions" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold">
                          {language === 'pt' ? 'Interações medicamentosas' : 'Drug interactions'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed">{info.interactions}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}

            {/* OpenFDA / ANVISA Section */}
            {(anvisaLoading || anvisaInfo) && (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border-b">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {language === 'pt' ? 'Informações do Bulário (OpenFDA)' : 'Drug Label Info (OpenFDA)'}
                  </span>
                  <Badge variant="outline" className="ml-auto text-[10px] border-blue-300 text-blue-600">EN</Badge>
                </div>
                {anvisaLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : anvisaInfo && (
                  <Accordion type="multiple" className="px-2 py-1">
                    {anvisaInfo.genericName && (
                      <AccordionItem value="fda-generic" className="border-0">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          {language === 'pt' ? 'Nome genérico' : 'Generic name'}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          {anvisaInfo.genericName} {anvisaInfo.manufacturer ? `— ${anvisaInfo.manufacturer}` : ''}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {anvisaInfo.drugClass && (
                      <AccordionItem value="fda-class" className="border-0">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          {language === 'pt' ? 'Classe farmacológica' : 'Pharmacological class'}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          {anvisaInfo.drugClass}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {anvisaInfo.warnings && (
                      <AccordionItem value="fda-warnings" className="border-0">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          {language === 'pt' ? 'Avisos (FDA)' : 'Warnings (FDA)'}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3 leading-relaxed">
                          {anvisaInfo.warnings}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {anvisaInfo.contraindications && (
                      <AccordionItem value="fda-contra" className="border-0">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          {language === 'pt' ? 'Contraindicações (FDA)' : 'Contraindications (FDA)'}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3 leading-relaxed">
                          {anvisaInfo.contraindications}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
              </div>
            )}

            {/* Disclaimer */}
            {info && !isLoading && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === 'pt' 
                      ? 'As informações apresentadas são para fins educacionais e não substituem a orientação de um profissional de saúde. Consulte sempre seu médico ou farmacêutico antes de iniciar, modificar ou interromper qualquer tratamento.'
                      : 'The information provided is for educational purposes only and does not replace professional medical advice. Always consult your doctor or pharmacist before starting, changing, or stopping any treatment.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}