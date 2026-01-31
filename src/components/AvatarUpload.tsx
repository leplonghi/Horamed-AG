import { useState, useEffect } from "react";
import { useAuth, updateDocument } from "@/integrations/firebase";
import { storage } from "@/integrations/firebase/client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { toast } from "sonner";

import { useTranslation } from "@/contexts/LanguageContext";
interface AvatarUploadProps {
  avatarUrl: string | null;
  userEmail: string;
  onUploadComplete: (url: string) => void;
}

export default function AvatarUpload({ avatarUrl, userEmail, onUploadComplete }: AvatarUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(avatarUrl);

  // Update display URL when avatarUrl changes
  useEffect(() => {
    setDisplayUrl(avatarUrl);
  }, [avatarUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      if (!user) {
        toast.error("Não autenticado");
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.uid}/avatar.${fileExt}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress monitoring if needed
        },
        (error) => {
          console.error("Error uploading avatar:", error);
          toast.error("Erro ao fazer upload da foto");
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Update profile with public URL
            // Assuming profile is at users/{uid}/profile/me based on other migrations
            const { error: updateError } = await updateDocument(
              `users/${user.uid}/profile`,
              'me',
              { avatarUrl: downloadURL } // camelCase
            );

            if (updateError) throw updateError;

            setDisplayUrl(downloadURL);
            onUploadComplete(downloadURL);
            toast.success("Foto atualizada com sucesso!");
          } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error("Erro ao atualizar perfil");
          } finally {
            setUploading(false);
          }
        }
      );

    } catch (error: any) {
      console.error("Error setup upload:", error);
      toast.error("Erro ao iniciar upload");
      setUploading(false);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt={t("alt.avatar")} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {userEmail ? getInitials(userEmail) : <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>

        <label htmlFor="avatar-upload" className="absolute bottom-0 right-0">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full cursor-pointer"
            disabled={uploading}
            asChild
          >
            <span>
              <Camera className="h-4 w-4" />
            </span>
          </Button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Clique no ícone da câmera para alterar sua foto
      </p>
    </div>
  );
}
