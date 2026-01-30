import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { auth, addDocument } from "@/integrations/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  id: string;
  slug: string;
  label: string;
}

// Static categories for Firebase (matching the ones from Supabase)
const HEALTH_CATEGORIES: Category[] = [
  { id: "receita", slug: "receita", label: "Receita Médica" },
  { id: "exame", slug: "exame", label: "Exame" },
  { id: "vacinacao", slug: "vacinacao", label: "Vacinação" },
  { id: "consulta", slug: "consulta", label: "Consulta" },
  { id: "outro", slug: "outro", label: "Outro" }
];

export default function CofreManualCreate() {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const { t } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categorySlug: "",
    provider: "",
    issuedAt: "",
    expiresAt: "",
    notes: ""
  });

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('cofreManual.addTitle'));
      return;
    }

    if (!activeProfile?.id) {
      toast.error(t('cofreManual.selectProfile'));
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error(t('errors.notAuthenticated'));

      const documentData = {
        userId: user.uid,
        profileId: activeProfile.id,
        title: formData.title.trim(),
        categorySlug: formData.categorySlug || null,
        provider: formData.provider.trim() || null,
        issuedAt: formData.issuedAt || null,
        expiresAt: formData.expiresAt || null,
        notes: formData.notes.trim() || null,
        filePath: "", // Documento sem arquivo
        mimeType: "text/plain",
        extractionStatus: "manual",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: newDoc, error } = await addDocument(`users/${user.uid}/healthDocuments`, documentData);

      if (error || !newDoc) throw error || new Error("Failed to create document");

      toast.success(t('cofreManual.success'));
      navigate(`/carteira/${newDoc.id}`);
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      toast.error(t('cofreManual.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />

      <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('cofreManual.title')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('cofreManual.subtitle')}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('cofreManual.docTitle')} *</Label>
              <Input
                id="title"
                placeholder={t('cofreManual.docTitlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">{t('cofreManual.category')}</Label>
              <Select
                value={formData.categorySlug}
                onValueChange={(value) => setFormData({ ...formData, categorySlug: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('cofreManual.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">{t('cofreManual.provider')}</Label>
              <Input
                id="provider"
                placeholder={t('cofreManual.providerPlaceholder')}
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issued_at">{t('cofreManual.issueDate')}</Label>
                <Input
                  id="issued_at"
                  type="date"
                  value={formData.issuedAt}
                  onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">{t('cofreManual.expiryDate')}</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('cofreManual.notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('cofreManual.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.notes.length}/1000
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('cofreManual.save')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}