import { useState, useEffect } from "react";
import { auth, addDocument } from "@/integrations/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarUpload from "@/components/AvatarUpload";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { activeProfile, updateProfile, refresh } = useUserProfiles();
  const [profileData, setProfileData] = useState<any>({
    full_name: "",
    nickname: "",
    weight_kg: "",
    height_cm: "",
    birth_date: "",
    avatar_url: null,
  });

  useEffect(() => {
    loadProfile();
  }, [activeProfile]);

  const loadProfile = () => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email || "");
    }

    if (activeProfile) {
      setProfileData({
        full_name: activeProfile.name || "",
        nickname: "", // UserProfile interface doesn't have nickname
        weight_kg: activeProfile.weightKg?.toString() || "",
        height_cm: activeProfile.heightCm?.toString() || "",
        birth_date: activeProfile.birthDate || "",
        avatar_url: activeProfile.avatarUrl || user?.photoURL || null,
      });
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (!activeProfile) throw new Error("No active profile");

      const weightValue = profileData.weight_kg ? parseFloat(profileData.weight_kg) : null;
      const heightValue = profileData.height_cm ? parseFloat(profileData.height_cm) : null;

      // Update profile
      await updateProfile(activeProfile.id, {
        name: profileData.full_name,
        weightKg: weightValue,
        heightCm: heightValue,
        birthDate: profileData.birth_date || null,
        avatarUrl: profileData.avatar_url,
      });

      // If weight changed, save to vitalSigns history
      if (weightValue) {
        await addDocument(`users/${user.uid}/vitalSigns`, {
          profileId: activeProfile.id,
          weightKg: weightValue,
          measuredAt: new Date().toISOString(),
          notes: t('profile.updateFromProfile')
        });
      }

      await refresh();
      toast.success(t('profile.saveSuccess'));
      navigate("/perfil");
    } catch (error: any) {
      console.error(error);
      toast.error(t('profile.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{t('profile.personalInfo')}</h1>
        </div>

        {/* Avatar Upload */}
        <Card className="p-6">
          <AvatarUpload
            avatarUrl={profileData.avatar_url}
            userEmail={userEmail}
            onUploadComplete={(url) => setProfileData({ ...profileData, avatar_url: url })}
          />
        </Card>

        {/* Email (Read-only) */}
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </Card>

        {/* Personal Info */}
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">{t('profile.fullName')}</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                placeholder={t('profile.enterName')}
              />
            </div>

            <div>
              <Label htmlFor="birth_date">{t('profile.birthDate')}</Label>
              <Input
                id="birth_date"
                type="date"
                value={profileData.birth_date}
                onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Health Data */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">{t('profile.healthData')}</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="weight">{t('profile.weight')}</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={profileData.weight_kg}
                onChange={(e) => setProfileData({ ...profileData, weight_kg: e.target.value })}
                placeholder={t('profile.enterWeight')}
              />
            </div>

            <div>
              <Label htmlFor="height">{t('profile.height')}</Label>
              <Input
                id="height"
                type="number"
                value={profileData.height_cm}
                onChange={(e) => setProfileData({ ...profileData, height_cm: e.target.value })}
                placeholder={t('profile.enterHeight')}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveProfile}
          disabled={loading}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? t('profile.saving') : t('profile.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
