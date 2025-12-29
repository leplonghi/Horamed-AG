import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register PWA service worker after render
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Register custom notification service worker first
    try {
      const notificationSW = await navigator.serviceWorker.register('/sw-notifications.js', {
        scope: '/'
      });
      console.log('[SW] Notification service worker registered:', notificationSW.scope);
    } catch (error) {
      console.error('[SW] Notification service worker registration failed:', error);
    }

    // Register PWA service worker
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log("New content available");
        },
        onOfflineReady() {
          console.log("App ready offline");
        },
      });
    }).catch(() => {
      // PWA registration failed silently
    });
  });
}
