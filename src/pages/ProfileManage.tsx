import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";
import { auth, deleteDocument } from "@/integrations/firebase";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function ProfileManage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { profiles, activeProfile, switchProfile, refresh } = useUserProfiles();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (profileId: string) => {
        try {
            setDeletingId(profileId);
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            // Prevent deleting the active profile
            if (activeProfile?.id === profileId) {
                toast.error(t('profile.cannotDeleteActive'));
                return;
            }

            // Delete the profile
            await deleteDocument(`users/${user.uid}/profiles`, profileId);

            // Refresh profiles list
            await refresh();

            toast.success(t('profile.deleteSuccess'));
        } catch (error) {
            console.error("Error deleting profile:", error);
            toast.error(t('profile.deleteError'));
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (profileId: string) => {
        // Switch to the profile first, then navigate to edit
        const profile = profiles?.find(p => p.id === profileId);
        if (profile) {
            switchProfile(profile);
            navigate(`/perfil/editar/${profileId}`);
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
                    <h1 className="text-xl font-bold text-foreground">{t('profile.manageProfiles')}</h1>
                </div>

                {/* Info Card */}
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        {t('profile.manageProfilesDesc')}
                    </p>
                </Card>

                {/* Profiles List */}
                <div className="space-y-3">
                    {profiles?.map((profile) => {
                        const isActive = activeProfile?.id === profile.id;
                        const isDeleting = deletingId === profile.id;

                        return (
                            <Card key={profile.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={profile.avatarUrl} />
                                        <AvatarFallback>
                                            <UserCircle className="h-8 w-8" />
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold truncate">{profile.name}</h3>
                                            {isActive && (
                                                <Badge variant="default" className="text-xs">
                                                    {t('profile.active')}
                                                </Badge>
                                            )}
                                        </div>
                                        {profile.birthDate && (
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(profile.birthDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(profile.id)}
                                            title={t('common.edit')}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        {!isActive && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={isDeleting}
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('profile.deleteConfirmTitle')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('profile.deleteConfirmDesc', { name: profile.name })}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(profile.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            {t('common.delete')}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Empty State */}
                {(!profiles || profiles.length === 0) && (
                    <Card className="p-8 text-center">
                        <UserCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">{t('profile.noProfiles')}</p>
                        <Button onClick={() => navigate('/perfil/criar')}>
                            {t('profile.createFirstProfile')}
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
