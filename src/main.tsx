import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppBootstrapper } from "./domain/services/AppBootstrapper";

AppBootstrapper.init();

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("FATAL ERROR:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h1>Fatal App Error</h1>
    <pre>${String(error)}\n${(error as any)?.stack || ''}</pre>
  </div>`;
}

// Register PWA service workers after render
if ("serviceWorker" in navigator) {
  // Reload the page when a new SW takes control so users always get the latest build.
  // This fires after skipWaiting+clientsClaim — exactly once per SW update.
  let swReloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!swReloading) {
      swReloading = true;
      console.log('[SW] New service worker activated — reloading for latest build.');
      window.location.reload();
    }
  });

  window.addEventListener("load", async () => {
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh(updateSW) {
            // New content is available — immediately apply it.
            // The SW has skipWaiting+clientsClaim, so updateSW() activates the new SW
            // and the controllerchange listener above reloads the page.
            console.log('[SW] New version available — applying update...');
            updateSW?.();
          },
          onOfflineReady() {
            console.log('[SW] App ready for offline use.');
          },
          onRegisteredSW(swUrl, registration) {
            // Check for SW updates every 60 seconds to ensure fast rollouts
            setInterval(() => {
              registration?.update();
            }, 60 * 1000);
          },
        });
      })
      .catch(() => {
        // PWA registration failed silently
      });
  });
}
