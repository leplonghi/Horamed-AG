// vite.config.ts
import { defineConfig, loadEnv } from "file:///sessions/relaxed-great-thompson/mnt/horamed/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/relaxed-great-thompson/mnt/horamed/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///sessions/relaxed-great-thompson/mnt/horamed/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///sessions/relaxed-great-thompson/mnt/horamed/node_modules/vite-plugin-pwa/dist/index.js";
import { readFileSync } from "fs";
var __vite_injected_original_dirname = "/sessions/relaxed-great-thompson/mnt/horamed";
var { version } = JSON.parse(readFileSync("./package.json", "utf-8"));
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: false,
      hmr: {
        overlay: true
      },
      watch: {
        usePolling: false
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(version)
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "favicon.png",
          "icon-512.png",
          "icon-1024.png",
          "icons/icon-192.png",
          "icons/icon-192-maskable.png",
          "icons/icon-512-maskable.png",
          "apple-touch-icon.png"
        ],
        manifest: {
          name: "HoraMed - Gest\xE3o Completa da Sua Sa\xFAde",
          short_name: "HoraMed",
          description: "Gerencie medicamentos, exames e consultas. Receba lembretes inteligentes direto no celular.",
          theme_color: "#4A90D9",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/hoje?source=pwa",
          id: "horamed-pwa",
          lang: "pt-BR",
          dir: "ltr",
          icons: [
            {
              src: "/favicon.png?v=10",
              sizes: "64x64",
              type: "image/png"
            },
            {
              src: "/pwa-192x192.png?v=10",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-512x512.png?v=10",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/apple-touch-icon.png?v=10",
              sizes: "180x180",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/icon-512.png?v=10",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/icon-1024.png?v=10",
              sizes: "1024x1024",
              type: "image/png"
            }
          ],
          categories: ["health", "medical", "lifestyle"],
          prefer_related_applications: false,
          display_override: ["standalone", "minimal-ui"],
          handle_links: "preferred",
          launch_handler: {
            client_mode: "navigate-existing"
          },
          screenshots: [
            {
              src: "/screenshots/home.png",
              sizes: "390x844",
              type: "image/png",
              form_factor: "narrow",
              label: "Tela inicial do HoraMed"
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // 5MB limit
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,jpg,jpeg}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/, /^\/auth/],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "firebase-api-cache",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            },
            {
              urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "fonts-cache",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            }
          ],
          importScripts: ["/sw-notifications.js"]
        },
        devOptions: {
          enabled: mode === "development"
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"]
        }
      },
      rollupOptions: {
        output: {
          // Removed fragile manualChunks config that forced react into a generic vendor chunk.
          // Vite's default chunking strategy safely splits imports and respects execution order,
          // preventing "Cannot read properties of undefined (reading 'useState')" errors.
          // Optimize chunk file names
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 5e3,
      // Enable source maps for production debugging (optional, remove if not needed)
      sourcemap: false
    },
    optimizeDeps: {
      exclude: ["@capacitor/core", "@capacitor/app"],
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "date-fns",
        "framer-motion"
      ]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvcmVsYXhlZC1ncmVhdC10aG9tcHNvbi9tbnQvaG9yYW1lZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL3JlbGF4ZWQtZ3JlYXQtdGhvbXBzb24vbW50L2hvcmFtZWQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL3JlbGF4ZWQtZ3JlYXQtdGhvbXBzb24vbW50L2hvcmFtZWQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcclxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSBcImZzXCI7XHJcblxyXG4vLyBSZWFkIHZlcnNpb24gZnJvbSBwYWNrYWdlLmpzb24gYXQgYnVpbGQgdGltZVxyXG5jb25zdCB7IHZlcnNpb24gfSA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKFwiLi9wYWNrYWdlLmpzb25cIiwgXCJ1dGYtOFwiKSk7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxyXG4gICAgICBobXI6IHtcclxuICAgICAgICBvdmVybGF5OiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICB3YXRjaDoge1xyXG4gICAgICAgIHVzZVBvbGxpbmc6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICBfX0FQUF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KHZlcnNpb24pLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgICBWaXRlUFdBKHtcclxuICAgICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxyXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFtcclxuICAgICAgICAgIFwiZmF2aWNvbi5pY29cIixcclxuICAgICAgICAgIFwiZmF2aWNvbi5wbmdcIixcclxuICAgICAgICAgIFwiaWNvbi01MTIucG5nXCIsXHJcbiAgICAgICAgICBcImljb24tMTAyNC5wbmdcIixcclxuICAgICAgICAgIFwiaWNvbnMvaWNvbi0xOTIucG5nXCIsXHJcbiAgICAgICAgICBcImljb25zL2ljb24tMTkyLW1hc2thYmxlLnBuZ1wiLFxyXG4gICAgICAgICAgXCJpY29ucy9pY29uLTUxMi1tYXNrYWJsZS5wbmdcIixcclxuICAgICAgICAgIFwiYXBwbGUtdG91Y2gtaWNvbi5wbmdcIixcclxuICAgICAgICBdLFxyXG4gICAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgICBuYW1lOiBcIkhvcmFNZWQgLSBHZXN0XHUwMEUzbyBDb21wbGV0YSBkYSBTdWEgU2FcdTAwRkFkZVwiLFxyXG4gICAgICAgICAgc2hvcnRfbmFtZTogXCJIb3JhTWVkXCIsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXJlbmNpZSBtZWRpY2FtZW50b3MsIGV4YW1lcyBlIGNvbnN1bHRhcy4gUmVjZWJhIGxlbWJyZXRlcyBpbnRlbGlnZW50ZXMgZGlyZXRvIG5vIGNlbHVsYXIuXCIsXHJcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjNEE5MEQ5XCIsXHJcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZmZcIixcclxuICAgICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXQtcHJpbWFyeVwiLFxyXG4gICAgICAgICAgc2NvcGU6IFwiL1wiLFxyXG4gICAgICAgICAgc3RhcnRfdXJsOiBcIi9ob2plP3NvdXJjZT1wd2FcIixcclxuICAgICAgICAgIGlkOiBcImhvcmFtZWQtcHdhXCIsXHJcbiAgICAgICAgICBsYW5nOiBcInB0LUJSXCIsXHJcbiAgICAgICAgICBkaXI6IFwibHRyXCIsXHJcbiAgICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9mYXZpY29uLnBuZz92PTEwXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNjR4NjRcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9wd2EtMTkyeDE5Mi5wbmc/dj0xMFwiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL3B3YS01MTJ4NTEyLnBuZz92PTEwXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJhbnlcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvYXBwbGUtdG91Y2gtaWNvbi5wbmc/dj0xMFwiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE4MHgxODBcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL2ljb24tNTEyLnBuZz92PTEwXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvaWNvbi0xMDI0LnBuZz92PTEwXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTAyNHgxMDI0XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBjYXRlZ29yaWVzOiBbXCJoZWFsdGhcIiwgXCJtZWRpY2FsXCIsIFwibGlmZXN0eWxlXCJdLFxyXG4gICAgICAgICAgcHJlZmVyX3JlbGF0ZWRfYXBwbGljYXRpb25zOiBmYWxzZSxcclxuICAgICAgICAgIGRpc3BsYXlfb3ZlcnJpZGU6IFtcInN0YW5kYWxvbmVcIiwgXCJtaW5pbWFsLXVpXCJdLFxyXG4gICAgICAgICAgaGFuZGxlX2xpbmtzOiBcInByZWZlcnJlZFwiLFxyXG4gICAgICAgICAgbGF1bmNoX2hhbmRsZXI6IHtcclxuICAgICAgICAgICAgY2xpZW50X21vZGU6IFwibmF2aWdhdGUtZXhpc3RpbmdcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzY3JlZW5zaG90czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9zY3JlZW5zaG90cy9ob21lLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjM5MHg4NDRcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIGZvcm1fZmFjdG9yOiBcIm5hcnJvd1wiLFxyXG4gICAgICAgICAgICAgIGxhYmVsOiBcIlRlbGEgaW5pY2lhbCBkbyBIb3JhTWVkXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd29ya2JveDoge1xyXG4gICAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDUgKiAxMDI0ICogMTAyNCwgLy8gNU1CIGxpbWl0XHJcbiAgICAgICAgICBnbG9iUGF0dGVybnM6IFtcIioqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyLHdlYnAsanBnLGpwZWd9XCJdLFxyXG4gICAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogXCIvaW5kZXguaHRtbFwiLFxyXG4gICAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9hcGkvLCAvXlxcL2F1dGgvXSxcclxuICAgICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxyXG4gICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxyXG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZmlyZXN0b3JlXFwuZ29vZ2xlYXBpc1xcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrRmlyc3RcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZmlyZWJhc2UtYXBpLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBuZXR3b3JrVGltZW91dFNlY29uZHM6IDEwLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAyMDAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86cG5nfGpwZ3xqcGVnfHN2Z3xnaWZ8d2VicCkkLyxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiaW1hZ2VzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86d29mZjI/fHR0ZnxvdGZ8ZW90KSQvLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJmb250cy1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAyMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9mb250c1xcLig/Omdvb2dsZWFwaXN8Z3N0YXRpYylcXC5jb21cXC8uKi9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJnb29nbGUtZm9udHMtY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMzAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDM2NSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBpbXBvcnRTY3JpcHRzOiBbXCIvc3ctbm90aWZpY2F0aW9ucy5qc1wiXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgIGVuYWJsZWQ6IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIixcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgIF0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICAgICAgbWluaWZ5OiAndGVyc2VyJyxcclxuICAgICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXHJcbiAgICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxyXG4gICAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZyddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIC8vIFJlbW92ZWQgZnJhZ2lsZSBtYW51YWxDaHVua3MgY29uZmlnIHRoYXQgZm9yY2VkIHJlYWN0IGludG8gYSBnZW5lcmljIHZlbmRvciBjaHVuay5cclxuICAgICAgICAgIC8vIFZpdGUncyBkZWZhdWx0IGNodW5raW5nIHN0cmF0ZWd5IHNhZmVseSBzcGxpdHMgaW1wb3J0cyBhbmQgcmVzcGVjdHMgZXhlY3V0aW9uIG9yZGVyLFxyXG4gICAgICAgICAgLy8gcHJldmVudGluZyBcIkNhbm5vdCByZWFkIHByb3BlcnRpZXMgb2YgdW5kZWZpbmVkIChyZWFkaW5nICd1c2VTdGF0ZScpXCIgZXJyb3JzLlxyXG4gICAgICAgICAgLy8gT3B0aW1pemUgY2h1bmsgZmlsZSBuYW1lc1xyXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIEluY3JlYXNlIGNodW5rIHNpemUgd2FybmluZyBsaW1pdFxyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMDAsXHJcbiAgICAgIC8vIEVuYWJsZSBzb3VyY2UgbWFwcyBmb3IgcHJvZHVjdGlvbiBkZWJ1Z2dpbmcgKG9wdGlvbmFsLCByZW1vdmUgaWYgbm90IG5lZWRlZClcclxuICAgICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgIH0sXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgZXhjbHVkZTogW1wiQGNhcGFjaXRvci9jb3JlXCIsIFwiQGNhcGFjaXRvci9hcHBcIl0sXHJcbiAgICAgIGluY2x1ZGU6IFtcclxuICAgICAgICAncmVhY3QnLFxyXG4gICAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcclxuICAgICAgICAnZGF0ZS1mbnMnLFxyXG4gICAgICAgICdmcmFtZXItbW90aW9uJyxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1QsU0FBUyxjQUFjLGVBQWU7QUFDNVYsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFDeEIsU0FBUyxvQkFBb0I7QUFMN0IsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTSxFQUFFLFFBQVEsSUFBSSxLQUFLLE1BQU0sYUFBYSxrQkFBa0IsT0FBTyxD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
