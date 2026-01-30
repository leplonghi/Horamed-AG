import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowLeft, Loader2, Camera, Edit3 } from "lucide-react";
import { auth, storage, functions, addDocument, fetchCollection } from "@/integrations/firebase";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import { isPDF } from "@/lib/pdfProcessor";
import { useLanguage } from "@/contexts/LanguageContext";


export default function CofreUpload() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMedications, setExtractedMedications] = useState<any[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);

  const { activeProfile } = useUserProfiles();

  const validateImageQuality = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file size
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return { valid: false, error: t('cofre.upload.fileTooBig') };
    }

    // For images, check resolution
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };

        img.onload = () => {
          const minWidth = 800;
          const minHeight = 600;

          if (img.width < minWidth || img.height < minHeight) {
            resolve({
              valid: false,
              error: t('cofre.upload.imageTooSmall', { width: String(img.width), height: String(img.height) })
            });
          } else {
            resolve({ valid: true });
          }
        };

        img.onerror = () => {
          resolve({ valid: false, error: t('cofre.upload.cannotReadImage') });
        };

        reader.readAsDataURL(file);
      });
    }

    return { valid: true };
  };

  const extractFromImage = async (base64: string) => {
    let attempts = 0;
    let success = false;

    const extractDocument = httpsCallable(functions, 'extractDocument');

    while (attempts < 3 && !success) {
      try {
        const result = await extractDocument({ image: base64 });
        const data = result.data as any;

        if (data) {
          success = true;
          return data;
        }
        break;
      } catch (err: any) {
        if (attempts === 2 || err.message?.includes('400') || err.message?.includes('Invalid')) {
          throw err;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);

      const firstFile = newFiles[0];
      if (firstFile) {
        // Validate quality first
        const validation = await validateImageQuality(firstFile);
        if (!validation.valid) {
          toast.error(validation.error, { duration: 6000 });
          setFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
          return;
        }

        setIsExtracting(true);
        setUploading(true);
        toast.loading(t('cofre.upload.analyzing'), { id: "extract" });

        try {
          // First, upload the file
          const user = auth.currentUser;
          if (!user) throw new Error(t('cofre.upload.userNotAuth'));

          const fileExt = firstFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.uid}/${fileName}`;
          const fileRef = ref(storage, filePath);

          toast.loading(t('cofre.upload.uploading'), { id: "extract" });

          await uploadBytes(fileRef, firstFile);

          // Now extract data from the file
          toast.loading(t('cofre.upload.aiProcessing'), { id: "extract" });

          if (isPDF(firstFile)) {
            console.log('Processando PDF completo...');

            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64 = reader.result as string;
                const data = await extractFromImage(base64);

                if (data) {
                  await saveDocumentAutomatically(data, user.uid, filePath, firstFile.type);
                } else {
                  throw new Error(t('cofre.upload.cannotExtractPdf'));
                }
              } catch (err) {
                try {
                  const fileRef = ref(storage, filePath);
                  await deleteObject(fileRef);
                } catch (delErr) {
                  console.error("Error deleting file", delErr);
                }
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          } else {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = reader.result as string;

              try {
                const data = await extractFromImage(base64);

                if (data) {
                  await saveDocumentAutomatically(data, user.uid, filePath, firstFile.type);
                } else {
                  try {
                    const fileRef = ref(storage, filePath);
                    await deleteObject(fileRef);
                  } catch (delErr) {
                    console.error("Error deleting file", delErr);
                  }
                  throw new Error(t('cofre.upload.cannotExtractImage'));
                }
              } catch (err: any) {
                try {
                  const fileRef = ref(storage, filePath);
                  await deleteObject(fileRef);
                } catch (delErr) {
                  console.error("Error deleting file", delErr);
                }
                throw err;
              }
            };
            reader.readAsDataURL(firstFile);
          }
        } catch (error: any) {
          console.error('Erro ao processar documento:', error);
          toast.dismiss("extract");

          let errorMessage = "";
          let suggestions = "";

          if (error.message?.includes('Invalid') || error.message?.includes('formato')) {
            errorMessage = t('cofre.upload.invalidFormat');
            suggestions = t('cofre.upload.useFormats');
          } else if (error.message?.includes('large') || error.message?.includes('size')) {
            errorMessage = t('cofre.upload.fileTooLarge');
            suggestions = t('cofre.upload.reduceSizeTo');
          } else {
            errorMessage = t('cofre.upload.lowQuality');
            suggestions = t('cofre.upload.qualityTips');
          }

          toast.error(`${errorMessage} ${suggestions}`, { duration: 8000 });
          setIsExtracting(false);
          setUploading(false);
        }
      }
    }
  };

  const saveDocumentAutomatically = async (extractedData: any, userId: string, filePath: string, mimeType: string) => {
    try {
      toast.loading(t('cofre.upload.saving'), { id: "extract" });

      // Build comprehensive metadata based on category
      const metaData: any = {
        // Dados do médico
        doctorName: extractedData.doctor_name,
        doctorRegistration: extractedData.doctor_registration,
        doctorState: extractedData.doctor_state,
        specialty: extractedData.specialty,

        // Dados do emitente
        emitterName: extractedData.emitter_name,
        emitterAddress: extractedData.emitter_address,
        emitterCity: extractedData.emitter_city,
        emitterState: extractedData.emitter_state,
        emitterZip: extractedData.emitter_zip,
        emitterPhone: extractedData.emitter_phone,
        emitterCnpj: extractedData.emitter_cnpj,

        // Dados do paciente
        patientName: extractedData.patient_name,
        patientAge: extractedData.patient_age,
        patientCpf: extractedData.patient_cpf,
        patientAddress: extractedData.patient_address,

        // Outros dados
        diagnosis: extractedData.diagnosis,
        notes: extractedData.notes,
        followupDate: extractedData.followup_date,
        prescriptionType: extractedData.prescription_type,
      };

      // RECEITA: Store all prescription details including package info
      if (extractedData.category === 'receita' && extractedData.prescriptions?.length > 0) {
        metaData.prescriptions = extractedData.prescriptions.map((med: any) => ({
          drugName: med.drug_name,
          commercialName: med.commercial_name,
          dose: med.dose,
          frequency: med.frequency,
          duration: med.duration,
          durationDays: med.duration_days,
          instructions: med.instructions,
          withFood: med.with_food,
          isGeneric: med.is_generic,
          packageType: med.package_type,
          packageQuantity: med.package_quantity,
          activeIngredient: med.active_ingredient,
        }));
        metaData.prescriptionCount = extractedData.prescriptions.length;
        metaData.prescriptionDate = extractedData.issued_at;
      }

      // EXAME: Store exam values
      if (extractedData.category === 'exame' && extractedData.extracted_values?.length > 0) {
        metaData.extractedValues = extractedData.extracted_values;
        metaData.examType = extractedData.exam_type;
      }

      // VACINAÇÃO: Store vaccine details
      if (extractedData.category === 'vacinacao') {
        metaData.vaccineName = extractedData.vaccine_name;
        metaData.doseNumber = extractedData.dose_number;
        metaData.nextDoseDate = extractedData.next_dose_date;
      }

      const documentData = {
        userId: userId,
        profileId: activeProfile?.id,
        categorySlug: extractedData.category,
        title: extractedData.title,
        filePath: filePath,
        mimeType: mimeType,
        issuedAt: extractedData.issued_at || null,
        expiresAt: extractedData.expires_at || null,
        provider: extractedData.provider || null,
        confidenceScore: extractedData.confidence_score || 0,
        extractionStatus: 'confirmed',
        meta: metaData,
        ocrText: JSON.stringify(extractedData),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: newDoc, error: insertError } = await addDocument(
        `users/${userId}/healthDocuments`,
        documentData
      );

      if (insertError || !newDoc) throw insertError || new Error("Failed to create document");

      // Create related records based on category
      const createdRecords = await createRelatedRecords(extractedData, newDoc.id, userId);

      toast.dismiss("extract");

      // Show comprehensive success message
      const createdItems = [];
      if (createdRecords.consulta) createdItems.push(t('cofre.upload.consultationSaved'));
      if (createdRecords.exame) createdItems.push(t('cofre.upload.examSaved', { count: String(createdRecords.valoresCount || 0) }));
      if (createdRecords.evento) createdItems.push(t('cofre.upload.vaccineReminder'));

      if (createdItems.length > 0) {
        toast.success(t('cofre.upload.docSaved'), { duration: 4000 });
        toast.info(createdItems.join("\n"), { duration: 5000 });
      } else {
        toast.success(t('cofre.upload.docSavedShort'), { duration: 3000 });
      }

      // Show document summary
      const summary = [];
      if (extractedData.title) summary.push(`📄 ${extractedData.title}`);
      if (extractedData.provider) summary.push(`🏥 ${extractedData.provider}`);
      if (extractedData.doctor_name) {
        const doctorInfo = `👨‍⚕️ Dr(a). ${extractedData.doctor_name}`;
        if (extractedData.doctor_registration) {
          summary.push(`${doctorInfo} (CRM ${extractedData.doctor_registration})`);
        } else {
          summary.push(doctorInfo);
        }
      }
      if (extractedData.issued_at) summary.push(`📅 ${new Date(extractedData.issued_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}`);

      if (summary.length > 0) {
        toast.info(summary.join(" • "), { duration: 4000 });
      }

      // Check for medications to add
      if (extractedData.prescriptions && extractedData.prescriptions.length > 0) {
        setExtractedMedications(extractedData.prescriptions);
        setShowMedicationModal(true);
      } else {
        navigate(`/carteira/${newDoc.id}`);
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.dismiss("extract");
      toast.error(t('cofre.upload.saveError'));
      try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      } catch (delErr) {
        console.error("Error deleting file", delErr);
      }
    } finally {
      setIsExtracting(false);
      setUploading(false);
    }
  };

  const createRelatedRecords = async (extractedData: any, documentId: string, userId: string) => {
    const results: any = { consulta: false, exame: false, evento: false, valoresCount: 0 };

    try {
      // CONSULTA: Create consultation record
      if (extractedData.category === 'consulta') {
        const consultaData = {
          userId: userId,
          profileId: activeProfile?.id,
          documentId: documentId,
          dataConsulta: extractedData.issued_at || new Date().toISOString(),
          medicoNome: extractedData.doctor_name || null,
          especialidade: extractedData.specialty || null,
          local: extractedData.provider || null,
          observacoes: extractedData.diagnosis || extractedData.notes || null,
          status: 'realizada',
          createdAt: new Date().toISOString()
        };

        const { error } = await addDocument(`users/${userId}/consultations`, consultaData);
        if (!error) results.consulta = true;
      }

      // EXAME: Create exam record with values
      if (extractedData.category === 'exame' && extractedData.extracted_values?.length > 0) {
        const examData = {
          userId: userId,
          profileId: activeProfile?.id,
          documentId: documentId,
          dataExame: extractedData.issued_at || new Date().toISOString().split('T')[0],
          laboratorio: extractedData.provider || null,
          createdAt: new Date().toISOString()
        };

        const { data: createdExam } = await addDocument(`users/${userId}/exams`, examData);

        if (createdExam && createdExam.id) {
          results.exame = true;
          const exameId = createdExam.id;

          // Insert exam values
          const valores = extractedData.extracted_values.map((val: any) => ({
            examId: exameId,
            parameter: val.parameter,
            value: val.value ? parseFloat(val.value) : null,
            valueText: val.value?.toString() || null,
            unit: val.unit || null,
            referenceText: val.reference_range || null,
            referenceMin: val.reference_min ? parseFloat(val.reference_min) : null,
            referenceMax: val.reference_max ? parseFloat(val.reference_max) : null,
            status: val.status || null,
          }));

          // We'd typically batch add these, but for now simple iteration or just storing in the exam doc
          // Storing in a subcollection 'results' for the exam
          const resultsPromises = valores.map((val: any) => addDocument(`users/${userId}/exams/${exameId}/results`, val));
          await Promise.all(resultsPromises);

          results.valoresCount = valores.length;
        }
      }

      // VACINAÇÃO: Create health event
      if (extractedData.category === 'vacinacao') {
        const eventData = {
          userId: userId,
          profileId: activeProfile?.id,
          relatedDocumentId: documentId,
          type: 'reforco_vacina',
          title: extractedData.vaccine_name || 'Vacina',
          dueDate: extractedData.next_dose_date || extractedData.issued_at || new Date().toISOString().split('T')[0],
          notes: extractedData.dose_number ? `Dose ${extractedData.dose_number}` : null,
          createdAt: new Date().toISOString()
        };

        const { error } = await addDocument(`users/${userId}/healthEvents`, eventData);
        if (!error) results.evento = true;
      }
    } catch (error) {
      console.error("Error creating related records:", error);
      // Don't throw - document is already saved
    }

    return results;
  };

  const addMedicationsFromPrescription = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      toast.loading(t('cofre.upload.addingMeds'), { id: "add-meds" });

      for (const med of extractedMedications) {
        // Calculate treatment end date if duration is provided
        let endDate = null;
        if (med.duration_days) {
          const start = new Date();
          start.setDate(start.getDate() + parseInt(med.duration_days));
          endDate = start.toISOString().split('T')[0];
        }

        // Create medication item
        const itemData = {
          userId: user.uid,
          profileId: activeProfile?.id,
          name: med.drug_name || med.commercial_name,
          doseText: med.dose,
          category: 'medicamento',
          notes: med.instructions,
          withFood: med.with_food || false,
          treatmentEndDate: endDate,
          treatmentDurationDays: med.duration_days ? parseInt(med.duration_days) : null,
          createdAt: new Date().toISOString(),
          isActive: true
        };

        const { data: newItem, error: itemError } = await addDocument(`users/${user.uid}/medications`, itemData);

        if (itemError || !newItem) continue;

        // Create schedule based on frequency
        const times = parseFrequencyToTimes(med.frequency || '');

        await addDocument(`users/${user.uid}/schedules`, {
          itemId: newItem.id,
          freqType: 'daily',
          times: times,
          isActive: true,
          createdAt: new Date().toISOString()
        });

        // Create stock if package info available
        if (med.package_quantity) {
          await addDocument(`users/${user.uid}/stock`, {
            itemId: newItem.id,
            unitsTotal: parseInt(med.package_quantity) || 30,
            unitsLeft: parseInt(med.package_quantity) || 30,
            unitLabel: med.package_type || (language === 'pt' ? 'comprimidos' : 'tablets'),
            createdAt: new Date().toISOString()
          });
        }
      }

      toast.dismiss("add-meds");
      toast.success(t('cofre.upload.medsAdded'));
      setShowMedicationModal(false);
      navigate('/rotina');
    } catch (error) {
      console.error("Error adding medications:", error);
      toast.dismiss("add-meds");
      toast.error(t('cofre.upload.addMedsError'));
    }
  };

  const parseFrequencyToTimes = (frequency: string): string[] => {
    // Parse common frequency patterns like "8/8h", "12/12h", "3x ao dia"
    const times: string[] = [];

    if (frequency.includes('8/8') || frequency.includes('8h')) {
      times.push('08:00', '16:00', '00:00');
    } else if (frequency.includes('12/12') || frequency.includes('12h')) {
      times.push('08:00', '20:00');
    } else if (frequency.includes('24/24') || frequency.includes('24h') || frequency.includes('1x')) {
      times.push('08:00');
    } else if (frequency.includes('6/6') || frequency.includes('6h')) {
      times.push('06:00', '12:00', '18:00', '00:00');
    } else if (frequency.includes('4/4') || frequency.includes('4h')) {
      times.push('06:00', '10:00', '14:00', '18:00', '22:00', '02:00');
    } else if (frequency.includes('3x')) {
      times.push('08:00', '14:00', '20:00');
    } else if (frequency.includes('2x')) {
      times.push('08:00', '20:00');
    } else {
      // Default to 3 times a day
      times.push('08:00', '14:00', '20:00');
    }

    return times;
  };

  const requirementsTitle = language === 'pt' ? 'Requisitos para melhor extração' : 'Requirements for best extraction';
  const requirementsImages = language === 'pt'
    ? 'mínimo 800x600px, com boa iluminação e sem sombras'
    : 'minimum 800x600px, with good lighting and no shadows';
  const requirementsPdfs = language === 'pt'
    ? 'preferir documentos com texto selecionável'
    : 'prefer documents with selectable text';
  const requirementsFocus = language === 'pt'
    ? 'documento deve estar nítido e plano'
    : 'document must be sharp and flat';
  const requirementsSize = language === 'pt'
    ? 'máximo 20MB por arquivo'
    : 'maximum 20MB per file';
  const uploadFileBtn = language === 'pt' ? 'Enviar Arquivo' : 'Upload File';
  const uploadFileDesc = language === 'pt' ? 'PDF, JPG ou PNG (até 20MB)' : 'PDF, JPG, or PNG (up to 20MB)';
  const takePhotoBtn = language === 'pt' ? 'Tirar Foto' : 'Take Photo';
  const takePhotoDesc = language === 'pt' ? 'Fotografar documento direto' : 'Photograph document directly';
  const aiAnalyzing = language === 'pt' ? 'Analisando documento com IA avançada...' : 'Analyzing document with advanced AI...';
  const aiProcessing = language === 'pt' ? 'Processando e extraindo informações automaticamente' : 'Processing and extracting information automatically';
  const autoExtraction = language === 'pt' ? 'Extração e salvamento automáticos:' : 'Automatic extraction and saving:';
  const aiIdentifies = language === 'pt' ? 'IA identifica exames, receitas, vacinas e consultas' : 'AI identifies exams, prescriptions, vaccines, and consultations';
  const dataFilled = language === 'pt' ? 'Dados são preenchidos e salvos automaticamente' : 'Data is filled and saved automatically';
  const medsFound = language === 'pt' ? 'medicamento(s)' : 'medication(s)';
  const medsFoundDesc = language === 'pt'
    ? 'encontrados nesta receita. Vamos criar lembretes automáticos nos horários corretos!'
    : 'found in this prescription. Let\'s create automatic reminders at the right times!';
  const doseLabel = language === 'pt' ? 'Dose' : 'Dose';
  const frequencyLabel = language === 'pt' ? 'Frequência' : 'Frequency';
  const durationLabel = language === 'pt' ? 'Duração' : 'Duration';
  const daysLabel = language === 'pt' ? 'dias' : 'days';
  const adjustInfo = language === 'pt'
    ? 'Você poderá ajustar horários e doses depois na página "Rotina"'
    : 'You can adjust times and doses later on the "Routine" page';
  const notNowBtn = language === 'pt' ? 'Agora Não' : 'Not Now';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
        <Button variant="ghost" onClick={() => navigate("/carteira")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <h1 className="text-3xl font-bold mb-2">{t('cofre.upload.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('cofre.upload.subtitle')}
        </p>

        {isExtracting && (
          <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {aiAnalyzing}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiProcessing}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {requirementsTitle}
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 ml-6">
                <li>• <strong>{language === 'pt' ? 'Imagens:' : 'Images:'}</strong> {requirementsImages}</li>
                <li>• <strong>PDFs:</strong> {requirementsPdfs}</li>
                <li>• <strong>{language === 'pt' ? 'Foco:' : 'Focus:'}</strong> {requirementsFocus}</li>
                <li>• <strong>{language === 'pt' ? 'Tamanho:' : 'Size:'}</strong> {requirementsSize}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{uploadFileBtn}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadFileDesc}
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{takePhotoBtn}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {takePhotoDesc}
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-auto py-8"
                  onClick={() => navigate('/carteira/criar-manual')}
                  disabled={isExtracting}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Edit3 className="w-12 h-12 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{t('cofre.upload.addManually')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('cofre.upload.fillWithoutFile')}
                      </p>
                    </div>
                  </div>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-6 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">{files[0].name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>✨ <strong>{autoExtraction}</strong></p>
            <p>{aiIdentifies}</p>
            <p>{dataFilled}</p>
          </div>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="Carteira de documentos" />

      {/* Medication suggestion modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-lg animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('cofre.upload.prescriptionMeds')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('cofre.upload.addToRoutine')}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>{extractedMedications.length} {medsFound}</strong> {medsFoundDesc}
                </p>
              </div>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {extractedMedications.map((med, idx) => (
                  <div key={idx} className="p-4 border border-blue-200 dark:border-blue-800 bg-background rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💊</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{med.drug_name}</p>
                        <div className="text-sm space-y-1 mt-2">
                          {med.dose && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="w-5">💊</span>
                              <span>{doseLabel}: <strong>{med.dose}</strong></span>
                            </div>
                          )}
                          {med.frequency && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="w-5">⏰</span>
                              <span>{frequencyLabel}: <strong>{med.frequency}</strong></span>
                            </div>
                          )}
                          {med.duration_days && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="w-5">📅</span>
                              <span>{durationLabel}: <strong>{med.duration_days} {daysLabel}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  ℹ️ {adjustInfo}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowMedicationModal(false);
                      navigate('/carteira');
                    }}
                  >
                    {notNowBtn}
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={addMedicationsFromPrescription}
                  >
                    {t('cofre.upload.addToRoutineBtn')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Navigation />
    </div>
  );
}
