import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateVaccinationRecord } from "@/hooks/useVaccinationRecords";
import { X } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";

interface VaccineManualFormProps {
  profileId?: string;
  vaccineType: 'adulto' | 'infantil';
  onClose: () => void;
}

// Vaccine keys for translation
const ADULT_VACCINE_KEYS = [
  "dt", "dtpa", "hepatiteB", "febreAmarela", "tripliceViral", 
  "influenza", "pneumococica23", "meningococicaACWY", "covid19"
];

const CHILD_VACCINE_KEYS = [
  "bcg", "hepatiteBChild", "pentavalente", "vipvop", "rotavirus",
  "pneumococica10", "meningococicaC", "febreAmarelaChild", "tripliceViralChild",
  "tetraviral", "hepatiteA", "dtp", "varicela", "hpv"
];

export default function VaccineManualForm({ profileId, vaccineType, onClose }: VaccineManualFormProps) {
  const { t } = useLanguage();
  const createMutation = useCreateVaccinationRecord();
  
  // Build translated vaccine list
  const vaccines = useMemo(() => {
    const keys = vaccineType === 'adulto' ? ADULT_VACCINE_KEYS : CHILD_VACCINE_KEYS;
    return keys.map(key => ({
      name: t(`vaccines.vaccine.${key}.name`),
      prevention: t(`vaccines.vaccine.${key}.prevention`),
      key
    }));
  }, [vaccineType, t]);

  const [selectedVaccineKey, setSelectedVaccineKey] = useState("");
  const [formData, setFormData] = useState({
    vaccineName: "",
    diseasePrevention: "",
    doseDescription: "",
    applicationDate: "",
    nextDoseDate: "",
    vaccinationLocation: "",
    vaccinatorName: "",
    batchNumber: "",
    manufacturer: "",
    notes: "",
  });

  const handleVaccineSelect = (key: string) => {
    const vaccine = vaccines.find(v => v.key === key);
    setSelectedVaccineKey(key);
    setFormData({
      ...formData,
      vaccineName: vaccine?.name || key,
      diseasePrevention: vaccine?.prevention || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      profileId: profileId,
      vaccineType: vaccineType,
      officialSource: "Manual",
    });
    setSelectedVaccineKey("");
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {vaccineType === 'adulto' ? `💉 ${t('vaccines.addVaccineAdult')}` : `👶 ${t('vaccines.addVaccineChild')}`}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccineName">{t('vaccines.selectVaccine')} *</Label>
            <Select value={selectedVaccineKey} onValueChange={handleVaccineSelect} required>
              <SelectTrigger>
                <SelectValue placeholder={t('vaccines.selectVaccine')} />
              </SelectTrigger>
              <SelectContent>
                {vaccines.map((vaccine) => (
                  <SelectItem key={vaccine.key} value={vaccine.key}>
                    {vaccine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.diseasePrevention && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">{t('vaccines.prevents')}:</span> {formData.diseasePrevention}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doseDescription">{t('vaccines.doseLabel')}</Label>
              <Input
                id="doseDescription"
                value={formData.doseDescription}
                onChange={(e) => setFormData({ ...formData, doseDescription: e.target.value })}
                placeholder={t('vaccines.dosePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDate">{t('vaccines.applicationDate')} *</Label>
              <Input
                id="applicationDate"
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextDoseDate">{t('vaccines.nextDoseIfAny')}</Label>
            <Input
              id="nextDoseDate"
              type="date"
              value={formData.nextDoseDate}
              onChange={(e) => setFormData({ ...formData, nextDoseDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccinationLocation">{t('vaccines.applicationLocation')}</Label>
            <Input
              id="vaccinationLocation"
              value={formData.vaccinationLocation}
              onChange={(e) => setFormData({ ...formData, vaccinationLocation: e.target.value })}
              placeholder={t('vaccines.locationPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccinatorName">{t('vaccines.vaccinatorName')}</Label>
            <Input
              id="vaccinatorName"
              value={formData.vaccinatorName}
              onChange={(e) => setFormData({ ...formData, vaccinatorName: e.target.value })}
              placeholder={t('vaccines.vaccinatorPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">{t('vaccines.batchNumber')}</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder={t('vaccines.batchPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">{t('vaccines.manufacturerLabel')}</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder={t('vaccines.manufacturerPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('vaccines.observations')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('vaccines.observationsPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('vaccines.saving') : t('vaccines.saveRecord')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}