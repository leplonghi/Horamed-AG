import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SubscriptionBadge from "./SubscriptionBadge";
import { ThemeToggle } from "./ThemeToggle";
import ProfileSelector from "./ProfileSelector";
import SpotlightSearch from "./SpotlightSearch";
import VoiceControlButton from "./VoiceControlButton";

import logo from "@/assets/logo_HoraMed.png";
import { useAuth, fetchDocument } from "@/integrations/firebase";

function Header() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  // Keyboard shortcut for Spotlight (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      const googleAvatar = (user as any).user_metadata?.avatar_url;

      // Load profile avatar in background
      fetchDocument<any>("users", user.uid).then(({ data }) => {
        if (data?.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        } else if (googleAvatar) {
          setAvatarUrl(googleAvatar);
        }
      });
    }
  }, [user]);

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="absolute inset-0 bg-gradient-to-b from-card/95 via-card/90 to-card/80 backdrop-blur-xl border-b border-border/30" />
      <div className="relative max-w-4xl mx-auto py-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="HoraMed" width={44} height={40} className="h-10 w-auto shrink-0" loading="eager" />
            </Link>
            <SubscriptionBadge />
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Voice Control */}
            <VoiceControlButton className="h-8 w-8 md:h-10 md:w-10 p-0 shrink-0" />

            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSpotlightOpen(true)}
              className="h-8 w-8 md:h-10 md:w-10 p-0 text-muted-foreground hover:bg-muted/50 rounded-full shrink-0"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* Profile Selector - Visible as avatar on mobile, full on desktop */}
            <div className="flex items-center justify-center shrink-0">
              <ProfileSelector />
            </div>

            {/* Theme Toggle - Hidden on mobile to save space */}
            <div className="hidden sm:flex items-center justify-center shrink-0">
              <ThemeToggle />
            </div>

            {/* Account Settings Link (Avatar) - Hidden on mobile to avoid redundancy with ProfileSelector */}
            <Link to="/perfil" className="hidden sm:block shrink-0">
              <Avatar className="h-8 w-8 md:h-9 md:w-9 ring-1 ring-border hover-scale cursor-pointer">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {userEmail ? getInitials(userEmail) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
      <SpotlightSearch open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </header>
  );
}

export default memo(Header);