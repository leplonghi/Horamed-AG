import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { auth } from "@/integrations/firebase/client";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isCompleted, loading: onboardingLoading } = useOnboarding();
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Direct hostname check - more reliable than import.meta.env.PROD
  const hostname = window.location.hostname;
  const isOnLandingHost = hostname === 'horamed.net' || hostname === 'www.horamed.net' || hostname === 'horamed.me';

  useEffect(() => {
    // 1. Initial Loading block
    if (loading) return;

    console.log('🏁 Index initialized', { loading, user: !!user, isLanding: isOnLandingHost });

    // 2. Landing page exception - Only show landing if NOT logged in
    if (isOnLandingHost && !user) {
      console.log('🌐 Showing landing page (Landing host + No user)');
      return;
    }

    // 3. Auth Synchronizer Fallback
    // auth.currentUser is synchronous. If context (user) is null but auth.currentUser exists,
    // we are in the "syncing" phase right after login. DO NOT redirect to /auth yet.
    const directUser = auth.currentUser;
    
    if (user || directUser) {
      // User detected — wait for onboarding status before picking a destination
      if (onboardingLoading === false) {
        if (isCompleted === false) {
          console.log('📋 Onboarding required');
          navigate("/onboarding", { replace: true });
        } else {
          console.log('✅ Auth & Onboarding settled -> Dashboard');
          navigate("/hoje", { replace: true });
        }
      }
      // If onboardingLoading is true, we just wait for the next render
      return;
    }

    // 4. No user detected -> Redirect to Auth after a safety buffer
    // On mobile or slow networks, Firebase initialization can take several seconds.
    const safetyBuffer = setTimeout(() => {
      // Re-verify both context and direct Firebase instance before kicking to auth
      if (!auth.currentUser && !user && !loading) {
        console.log('👤 No user found after extended safety buffer -> /auth');
        navigate("/auth", { replace: true });
      } else if (loading || onboardingLoading) {
        console.log('⏳ Still loading after buffer, extending wait...');
      }
    }, 3000); // Increased from 1s to 3s to reflect AuthContext safety and slow mobile networks

    return () => clearTimeout(safetyBuffer);
  }, [user, loading, onboardingLoading, isCompleted, navigate, isOnLandingHost]);

  // CRITICAL: Show landing page immediately if on landing domain
  if (isOnLandingHost) {
    return <Landing />;
  }

  // On app domain or localhost: show loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground font-medium">Sincronizando HoraMed...</p>
      </div>
    </div>
  );
};

export default Index;
