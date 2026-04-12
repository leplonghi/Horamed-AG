import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isCompleted, loading: onboardingLoading } = useOnboarding();

  // Direct hostname check - more reliable than import.meta.env.PROD
  const hostname = window.location.hostname;
  const isOnLandingHost = hostname === 'horamed.net' || hostname === 'www.horamed.net' || hostname === 'horamed.me';

  useEffect(() => {
    // On landing domain: only redirect authenticated users to app
    if (isOnLandingHost) {
      if (!loading && user) {
        window.location.href = isCompleted ? "https://app.horamed.net/hoje" : "https://app.horamed.net/onboarding";
      }
      return;
    }

    // On app domain: redirect based on auth state
    if (!loading && !onboardingLoading) {
      if (user) {
        if (isCompleted === false) {
          navigate("/onboarding");
        } else {
          navigate("/hoje");
        }
      } else {
        navigate("/auth");
      }
    }
  }, [user, loading, onboardingLoading, navigate, isOnLandingHost, isCompleted]);

  // CRITICAL: Show landing page immediately on landing domain
  if (isOnLandingHost) {
    return <Landing />;
  }

  // On app domain: show loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Iniciando HoraMed...</p>
      </div>
    </div>
  );
};

export default Index;
