import { useEffect, useState } from "react";
import AppProviders from "@/app/AppProviders";
import AppShell from "@/app/AppShell";
import SplashScreen from "@/components/SplashScreen";
import { isLandingDomain } from "@/lib/domainConfig";

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isLandingDomain()) {
      setShowSplash(false);
      return;
    }

    const hasSeenSplash = sessionStorage.getItem("horamed_splash_shown");
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("horamed_splash_shown", "true");
    setShowSplash(false);
  };

  return (
    <AppProviders>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && <AppShell />}
    </AppProviders>
  );
};

export default App;
