import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProfileCacheProvider } from "@/contexts/ProfileCacheContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { queryClient } from "@/app/queryClient";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <LanguageProvider>
              <TooltipProvider>
                <ProfileCacheProvider>
                  <SubscriptionProvider>
                    <BrowserRouter>
                      <AuthProvider>
                        <OnboardingProvider>
                          {children}
                        </OnboardingProvider>
                      </AuthProvider>
                    </BrowserRouter>
                  </SubscriptionProvider>
                </ProfileCacheProvider>
              </TooltipProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
