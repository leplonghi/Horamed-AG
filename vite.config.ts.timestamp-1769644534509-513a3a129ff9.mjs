// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Antigravity/horamed/horamed/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Antigravity/horamed/horamed/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Antigravity/horamed/horamed/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Antigravity/horamed/horamed/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Antigravity\\horamed\\horamed";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080
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
          theme_color: "#7c3aed",
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
              src: "/favicon.png?v=3",
              sizes: "64x64",
              type: "image/png"
            },
            {
              src: "/apple-touch-icon.png?v=3",
              sizes: "180x180",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/icon-512.png?v=3",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/icon-1024.png?v=3",
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
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,jpg,jpeg}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/supabase/],
          skipWaiting: false,
          clientsClaim: false,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${env.VITE_SUPABASE_URL?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || ""}/.*`, "i"),
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
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
          ]
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
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "router": ["react-router-dom"],
            "ui-core": ["@radix-ui/react-dialog", "@radix-ui/react-popover"],
            "ui-forms": ["@radix-ui/react-checkbox", "@radix-ui/react-radio-group", "@radix-ui/react-switch", "@radix-ui/react-slider"],
            "ui-display": ["@radix-ui/react-tabs", "@radix-ui/react-toast", "@radix-ui/react-accordion", "@radix-ui/react-collapsible"],
            "ui-menu": ["@radix-ui/react-dropdown-menu", "@radix-ui/react-context-menu", "@radix-ui/react-menubar"],
            "charts": ["recharts"],
            "motion": ["framer-motion"],
            "date": ["date-fns", "date-fns-tz"],
            "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "supabase": ["@supabase/supabase-js"],
            "pdf": ["jspdf", "jspdf-autotable"]
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ["@capacitor/core", "@capacitor/app"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxBbnRpZ3Jhdml0eVxcXFxob3JhbWVkXFxcXGhvcmFtZWRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXEFudGlncmF2aXR5XFxcXGhvcmFtZWRcXFxcaG9yYW1lZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovQW50aWdyYXZpdHkvaG9yYW1lZC9ob3JhbWVkL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICAgIFZpdGVQV0Eoe1xyXG4gICAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXHJcbiAgICAgICAgaW5jbHVkZUFzc2V0czogW1xyXG4gICAgICAgICAgXCJmYXZpY29uLmljb1wiLFxyXG4gICAgICAgICAgXCJmYXZpY29uLnBuZ1wiLFxyXG4gICAgICAgICAgXCJpY29uLTUxMi5wbmdcIixcclxuICAgICAgICAgIFwiaWNvbi0xMDI0LnBuZ1wiLFxyXG4gICAgICAgICAgXCJpY29ucy9pY29uLTE5Mi5wbmdcIixcclxuICAgICAgICAgIFwiaWNvbnMvaWNvbi0xOTItbWFza2FibGUucG5nXCIsXHJcbiAgICAgICAgICBcImljb25zL2ljb24tNTEyLW1hc2thYmxlLnBuZ1wiLFxyXG4gICAgICAgICAgXCJhcHBsZS10b3VjaC1pY29uLnBuZ1wiLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgIG5hbWU6IFwiSG9yYU1lZCAtIEdlc3RcdTAwRTNvIENvbXBsZXRhIGRhIFN1YSBTYVx1MDBGQWRlXCIsXHJcbiAgICAgICAgICBzaG9ydF9uYW1lOiBcIkhvcmFNZWRcIixcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdlcmVuY2llIG1lZGljYW1lbnRvcywgZXhhbWVzIGUgY29uc3VsdGFzLiBSZWNlYmEgbGVtYnJldGVzIGludGVsaWdlbnRlcyBkaXJldG8gbm8gY2VsdWxhci5cIixcclxuICAgICAgICAgIHRoZW1lX2NvbG9yOiBcIiM3YzNhZWRcIixcclxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiLFxyXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXHJcbiAgICAgICAgICBvcmllbnRhdGlvbjogXCJwb3J0cmFpdC1wcmltYXJ5XCIsXHJcbiAgICAgICAgICBzY29wZTogXCIvXCIsXHJcbiAgICAgICAgICBzdGFydF91cmw6IFwiL2hvamU/c291cmNlPXB3YVwiLFxyXG4gICAgICAgICAgaWQ6IFwiaG9yYW1lZC1wd2FcIixcclxuICAgICAgICAgIGxhbmc6IFwicHQtQlJcIixcclxuICAgICAgICAgIGRpcjogXCJsdHJcIixcclxuICAgICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL2Zhdmljb24ucG5nP3Y9M1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvYXBwbGUtdG91Y2gtaWNvbi5wbmc/dj0zXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTgweDE4MFwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJhbnlcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvaWNvbi01MTIucG5nP3Y9M1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55IG1hc2thYmxlXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL2ljb24tMTAyNC5wbmc/dj0zXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTAyNHgxMDI0XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBjYXRlZ29yaWVzOiBbXCJoZWFsdGhcIiwgXCJtZWRpY2FsXCIsIFwibGlmZXN0eWxlXCJdLFxyXG4gICAgICAgICAgcHJlZmVyX3JlbGF0ZWRfYXBwbGljYXRpb25zOiBmYWxzZSxcclxuICAgICAgICAgIGRpc3BsYXlfb3ZlcnJpZGU6IFtcInN0YW5kYWxvbmVcIiwgXCJtaW5pbWFsLXVpXCJdLFxyXG4gICAgICAgICAgaGFuZGxlX2xpbmtzOiBcInByZWZlcnJlZFwiLFxyXG4gICAgICAgICAgbGF1bmNoX2hhbmRsZXI6IHtcclxuICAgICAgICAgICAgY2xpZW50X21vZGU6IFwibmF2aWdhdGUtZXhpc3RpbmdcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzY3JlZW5zaG90czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9zY3JlZW5zaG90cy9ob21lLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjM5MHg4NDRcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIGZvcm1fZmFjdG9yOiBcIm5hcnJvd1wiLFxyXG4gICAgICAgICAgICAgIGxhYmVsOiBcIlRlbGEgaW5pY2lhbCBkbyBIb3JhTWVkXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd29ya2JveDoge1xyXG4gICAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmMix3ZWJwLGpwZyxqcGVnfVwiXSxcclxuICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6IFwiL2luZGV4Lmh0bWxcIixcclxuICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpLywgL15cXC9hdXRoLywgL15cXC9zdXBhYmFzZS9dLFxyXG4gICAgICAgICAgc2tpcFdhaXRpbmc6IGZhbHNlLFxyXG4gICAgICAgICAgY2xpZW50c0NsYWltOiBmYWxzZSxcclxuICAgICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcclxuICAgICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiBuZXcgUmVnRXhwKGBeJHtlbnYuVklURV9TVVBBQkFTRV9VUkw/LnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJykgfHwgJyd9Ly4qYCwgJ2knKSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIk5ldHdvcmtGaXJzdFwiLFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJzdXBhYmFzZS1hcGktY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIG5ldHdvcmtUaW1lb3V0U2Vjb25kczogMTAsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzpwbmd8anBnfGpwZWd8c3ZnfGdpZnx3ZWJwKSQvLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZXMtY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzp3b2ZmMj98dHRmfG90Znxlb3QpJC8sXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImZvbnRzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDIwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuKD86Z29vZ2xlYXBpc3xnc3RhdGljKVxcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImdvb2dsZS1mb250cy1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAzMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgIGVuYWJsZWQ6IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIixcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgIF0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxyXG4gICAgICAgICAgICAncm91dGVyJzogWydyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgICd1aS1jb3JlJzogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJ10sXHJcbiAgICAgICAgICAgICd1aS1mb3Jtcyc6IFsnQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94JywgJ0ByYWRpeC11aS9yZWFjdC1yYWRpby1ncm91cCcsICdAcmFkaXgtdWkvcmVhY3Qtc3dpdGNoJywgJ0ByYWRpeC11aS9yZWFjdC1zbGlkZXInXSxcclxuICAgICAgICAgICAgJ3VpLWRpc3BsYXknOiBbJ0ByYWRpeC11aS9yZWFjdC10YWJzJywgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCcsICdAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uJywgJ0ByYWRpeC11aS9yZWFjdC1jb2xsYXBzaWJsZSddLFxyXG4gICAgICAgICAgICAndWktbWVudSc6IFsnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLCAnQHJhZGl4LXVpL3JlYWN0LWNvbnRleHQtbWVudScsICdAcmFkaXgtdWkvcmVhY3QtbWVudWJhciddLFxyXG4gICAgICAgICAgICAnY2hhcnRzJzogWydyZWNoYXJ0cyddLFxyXG4gICAgICAgICAgICAnbW90aW9uJzogWydmcmFtZXItbW90aW9uJ10sXHJcbiAgICAgICAgICAgICdkYXRlJzogWydkYXRlLWZucycsICdkYXRlLWZucy10eiddLFxyXG4gICAgICAgICAgICAnZm9ybXMnOiBbJ3JlYWN0LWhvb2stZm9ybScsICdAaG9va2Zvcm0vcmVzb2x2ZXJzJywgJ3pvZCddLFxyXG4gICAgICAgICAgICAnc3VwYWJhc2UnOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxyXG4gICAgICAgICAgICAncGRmJzogWydqc3BkZicsICdqc3BkZi1hdXRvdGFibGUnXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgZXhjbHVkZTogW1wiQGNhcGFjaXRvci9jb3JlXCIsIFwiQGNhcGFjaXRvci9hcHBcIl0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9SLFNBQVMsY0FBYyxlQUFlO0FBQzFULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsTUFDMUMsUUFBUTtBQUFBLFFB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
