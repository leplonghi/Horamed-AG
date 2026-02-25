
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";
import { storage, auth, updateDocument } from "@/integrations/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import ImageCropperDialog from "./ImageCropperDialog";

interface ProfileHeroHeaderProps {
  userEmail: string;
  onLogout: () => void;
}

export default function ProfileHeroHeader({ userEmail, onLogout }: ProfileHeroHeaderProps) {
  const { isPremium } = useSubscription();
  const { activeProfile, refresh } = useUserProfiles();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('common.invalidImageFormat'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(t('common.imageTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSelectedImage(reader.result?.toString() || null);
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    console.log("Crop complete, blob received in parent:", croppedBlob.size);
    setCropperOpen(false);
    await uploadAvatar(croppedBlob);
  };

  const uploadAvatar = async (fileBlob: Blob) => {
    try {
      console.log("Starting avatar upload, blob size:", fileBlob.size);
      setIsUploading(true);
      const user = auth.currentUser;

      if (!user) {
        console.error("No authenticated user found");
        toast.error("Usuário não autenticado");
        return;
      }

      if (!activeProfile) {
        console.error("No active profile found");
        toast.error("Perfil ativo não encontrado");
        return;
      }

      const fileName = `avatar_${Date.now()}.jpg`;
      // Path matches the new storage rule: /users/{userId}/profiles/{profileId}/{fileName}
      const storagePath = `users/${user.uid}/profiles/${activeProfile.id}/${fileName}`;
      console.log("Uploading to path:", storagePath);

      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, fileBlob);
      console.log("Upload completed, snapshot:", snapshot.metadata.fullPath);

      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadUrl);

      const { error } = await updateDocument(`users/${user.uid}/profiles`, activeProfile.id, {
        avatarUrl: downloadUrl
      });

      if (error) {
        console.error("Error updating firestore document:", error);
        throw error;
      }

      console.log("Firestore document updated successfully");

      // Force refresh of profiles to update UI immediately
      await refresh();

      toast.success(t('profile.avatarUpdated') || "Avatar atualizado com sucesso!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.avatarUpdateError') || "Erro ao atualizar avatar", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
    }
  };

  return (
    <>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        isLoading={isUploading}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl p-6",
          "bg-gradient-to-br from-primary/20 via-primary/10 to-background",
          "border border-primary/20"
        )}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Profile info - Simplified for Hero */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <Avatar className="h-24 w-24 ring-4 ring-primary/30 shadow-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {activeProfile?.avatarUrl || (activeProfile as any)?.avatar_url ? (
                  <AvatarImage
                    src={activeProfile.avatarUrl || (activeProfile as any)?.avatar_url}
                    alt={activeProfile.name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    {getInitials(activeProfile?.name || '')}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Upload Overlay/Button */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                  isUploading && "opacity-100 bg-black/60"
                )}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />

              {/* Edit Button (Facebook Style) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-background border border-border shadow-lg hover:bg-muted transition-colors z-10"
                title={t('profile.changePhoto')}
              >
                <Camera className="h-4 w-4 text-primary" />
              </button>

              {/* Premium badge */}
              {isPremium && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-gradient-to-br from-warning to-orange-500 shadow-lg z-20"
                >
                  <Crown className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-bold truncate"
              >
                {activeProfile?.name}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground truncate"
              >
                {userEmail}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// UX Audit pass: placeholder aria-label <label>
