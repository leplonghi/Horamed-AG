import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
  window.addEventListener("load", async () => {
    // Register notification worker under its own scope to avoid conflicts
    // Register notification worker under its own scope to avoid conflicts
    // REMOVED: Merged into main PWA service worker via importScripts
    /* 
    try {
      const notificationSW = await navigator.serviceWorker.register(
        "/notifications/sw-notifications.js",
        { scope: "/notifications/" }
      );
      console.log(
        "[SW] Notification service worker registered:",
        notificationSW.scope
      );
    } catch (error) {
      console.error("[SW] Notification service worker registration failed:", error);
    }
    */

    // Register PWA service worker
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            console.log("New content available");
          },
          onOfflineReady() {
            console.log("App ready offline");
          },
        });
      })
      .catch(() => {
        // PWA registration failed silently
      });
  });
}
