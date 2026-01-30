import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, ChevronDown, Settings } from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileSelector() {
  const { profiles, activeProfile, switchProfile } = useUserProfiles();
  const { isPremium } = useSubscription();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleCreateProfile = () => {
    if (!isPremium) {
      navigate('/planos');
      return;
    }
    navigate('/perfis/novo');
    setOpen(false);
  };

  const handleSelectProfile = (profile: any) => {
    switchProfile(profile);
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels: { [key: string]: string } = {
      self: t('profileSelector.you'),
      child: t('profileSelector.child'),
      parent: t('profileSelector.parent'),
      spouse: t('profileSelector.spouse'),
      other: t('profileSelector.other')
    };
    return labels[relationship] || relationship;
  };

  if (!activeProfile) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 hover:bg-accent/50 transition-all duration-200 px-0 md:px-2"
        >
          <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-primary/20">
            <AvatarImage src={activeProfile.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] md:text-xs font-semibold">
              {getInitials(activeProfile.name)}
            </AvatarFallback>
          </Avatar>
          {profiles.length > 1 && (
            <>
              <span className="hidden md:inline text-xs font-medium max-w-[80px] truncate">
                {activeProfile.name}
              </span>
              <ChevronDown className="hidden md:block h-4 w-4 opacity-50" />
            </>
          )}
          {profiles.length === 1 && (
            <>
              <span className="hidden md:inline text-xs font-medium max-w-[80px] truncate">
                {activeProfile.name}
              </span>
              <ChevronDown className="hidden md:block h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('profileSelector.selectProfile')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${activeProfile.id === profile.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
            >
              <Avatar>
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{profile.name}</p>
                  {profile.isPrimary && (
                    <Badge variant="secondary" className="text-xs">{t('profileSelector.main')}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRelationshipLabel(profile.relationship)}
                </p>
              </div>
            </button>
          ))}

          <Button
            onClick={handleCreateProfile}
            variant="outline"
            className="w-full gap-2"
            disabled={!isPremium && profiles.length >= 1}
          >
            <Plus className="h-4 w-4" />
            {t('profileSelector.addProfile')} {!isPremium && `(${t('profileSelector.premium')})`}
          </Button>

          <Button
            onClick={() => {
              navigate('/perfil');
              setOpen(false);
            }}
            variant="ghost"
            className="w-full gap-2 mt-2 text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
            {t('common.settings')}
          </Button>

          {!isPremium && (
            <p className="text-xs text-center text-muted-foreground">
              {t('profileSelector.multipleProfiles')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}