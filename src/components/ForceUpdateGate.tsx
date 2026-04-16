import type { ReactNode } from "react";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useForceUpdate } from "@/hooks/useForceUpdate";

interface ForceUpdateGateProps {
  children: ReactNode;
}

function openStore(url?: string) {
  if (!url || typeof window === "undefined") {
    return;
  }

  window.location.href = url;
}

export default function ForceUpdateGate({ children }: ForceUpdateGateProps) {
  const { checking, platform, recheck, updateInfo } = useForceUpdate();
  const isBlocked = Boolean(updateInfo?.required);

  useEffect(() => {
    if (platform !== "android" || !isBlocked) {
      return;
    }

    let backButtonHandle: { remove: () => Promise<void> } | null = null;

    void App.addListener("backButton", () => {
      // Intentionally swallow Android back presses while a mandatory update is active.
    }).then((handle) => {
      backButtonHandle = handle;
    });

    return () => {
      if (backButtonHandle) {
        void backButtonHandle.remove();
      }
    };
  }, [isBlocked, platform]);

  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col bg-background px-6 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-8%] h-48 w-48 rounded-full bg-primary/14 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-6%] h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="card-tier-1 rounded-[2rem] p-7 sm:p-8">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/12 text-3xl text-primary">
              !
            </div>

            <p className="text-label mb-3">Atualização obrigatória</p>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">
              Atualize o HoraMed para continuar
            </h1>
            <p className="text-description mb-6">
              {updateInfo.message ||
                "Esta versão do app não atende mais ao requisito mínimo e precisa ser atualizada para liberar o uso."}
            </p>

            <div className="mb-8 space-y-3 rounded-3xl border border-border/70 bg-card/80 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Versão atual</span>
                <span className="font-semibold text-foreground">{updateInfo.currentVersion}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Versão mínima</span>
                <span className="font-semibold text-foreground">{updateInfo.minimumVersion}</span>
              </div>
              {updateInfo.latestVersion && (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Versão mais recente</span>
                  <span className="font-semibold text-foreground">{updateInfo.latestVersion}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => openStore(updateInfo.storeUrl)}
                className="btn-fluid flex min-h-[56px] w-full items-center justify-center rounded-2xl px-5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!updateInfo.storeUrl}
              >
                Atualizar agora
              </button>

              <button
                type="button"
                onClick={() => void recheck()}
                className="flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-border/80 bg-card/70 px-5 text-base font-semibold text-foreground transition-fast disabled:cursor-not-allowed disabled:opacity-60"
                disabled={checking}
              >
                {checking ? "Verificando..." : "Verificar novamente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
