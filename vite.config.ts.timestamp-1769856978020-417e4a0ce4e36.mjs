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
      port: 8080,
      strictPort: false,
      hmr: {
        overlay: true
      },
      watch: {
        usePolling: false
      }
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
          skipWaiting: true,
          clientsClaim: true,
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
      target: "es2015",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"]
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("firebase")) {
                return "firebase";
              }
              return "vendor";
            }
          },
          // Optimize chunk file names
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 2e3,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxBbnRpZ3Jhdml0eVxcXFxob3JhbWVkXFxcXGhvcmFtZWRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXEFudGlncmF2aXR5XFxcXGhvcmFtZWRcXFxcaG9yYW1lZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovQW50aWdyYXZpdHkvaG9yYW1lZC9ob3JhbWVkL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxyXG4gICAgICBobXI6IHtcclxuICAgICAgICBvdmVybGF5OiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICB3YXRjaDoge1xyXG4gICAgICAgIHVzZVBvbGxpbmc6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgICBWaXRlUFdBKHtcclxuICAgICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxyXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFtcclxuICAgICAgICAgIFwiZmF2aWNvbi5pY29cIixcclxuICAgICAgICAgIFwiZmF2aWNvbi5wbmdcIixcclxuICAgICAgICAgIFwiaWNvbi01MTIucG5nXCIsXHJcbiAgICAgICAgICBcImljb24tMTAyNC5wbmdcIixcclxuICAgICAgICAgIFwiaWNvbnMvaWNvbi0xOTIucG5nXCIsXHJcbiAgICAgICAgICBcImljb25zL2ljb24tMTkyLW1hc2thYmxlLnBuZ1wiLFxyXG4gICAgICAgICAgXCJpY29ucy9pY29uLTUxMi1tYXNrYWJsZS5wbmdcIixcclxuICAgICAgICAgIFwiYXBwbGUtdG91Y2gtaWNvbi5wbmdcIixcclxuICAgICAgICBdLFxyXG4gICAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgICBuYW1lOiBcIkhvcmFNZWQgLSBHZXN0XHUwMEUzbyBDb21wbGV0YSBkYSBTdWEgU2FcdTAwRkFkZVwiLFxyXG4gICAgICAgICAgc2hvcnRfbmFtZTogXCJIb3JhTWVkXCIsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXJlbmNpZSBtZWRpY2FtZW50b3MsIGV4YW1lcyBlIGNvbnN1bHRhcy4gUmVjZWJhIGxlbWJyZXRlcyBpbnRlbGlnZW50ZXMgZGlyZXRvIG5vIGNlbHVsYXIuXCIsXHJcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjN2MzYWVkXCIsXHJcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZmZcIixcclxuICAgICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXQtcHJpbWFyeVwiLFxyXG4gICAgICAgICAgc2NvcGU6IFwiL1wiLFxyXG4gICAgICAgICAgc3RhcnRfdXJsOiBcIi9ob2plP3NvdXJjZT1wd2FcIixcclxuICAgICAgICAgIGlkOiBcImhvcmFtZWQtcHdhXCIsXHJcbiAgICAgICAgICBsYW5nOiBcInB0LUJSXCIsXHJcbiAgICAgICAgICBkaXI6IFwibHRyXCIsXHJcbiAgICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9mYXZpY29uLnBuZz92PTNcIixcclxuICAgICAgICAgICAgICBzaXplczogXCI2NHg2NFwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL2FwcGxlLXRvdWNoLWljb24ucG5nP3Y9M1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE4MHgxODBcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL2ljb24tNTEyLnBuZz92PTNcIixcclxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgICBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9pY29uLTEwMjQucG5nP3Y9M1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjEwMjR4MTAyNFwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgY2F0ZWdvcmllczogW1wiaGVhbHRoXCIsIFwibWVkaWNhbFwiLCBcImxpZmVzdHlsZVwiXSxcclxuICAgICAgICAgIHByZWZlcl9yZWxhdGVkX2FwcGxpY2F0aW9uczogZmFsc2UsXHJcbiAgICAgICAgICBkaXNwbGF5X292ZXJyaWRlOiBbXCJzdGFuZGFsb25lXCIsIFwibWluaW1hbC11aVwiXSxcclxuICAgICAgICAgIGhhbmRsZV9saW5rczogXCJwcmVmZXJyZWRcIixcclxuICAgICAgICAgIGxhdW5jaF9oYW5kbGVyOiB7XHJcbiAgICAgICAgICAgIGNsaWVudF9tb2RlOiBcIm5hdmlnYXRlLWV4aXN0aW5nXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2NyZWVuc2hvdHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvc2NyZWVuc2hvdHMvaG9tZS5wbmdcIixcclxuICAgICAgICAgICAgICBzaXplczogXCIzOTB4ODQ0XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgICBmb3JtX2ZhY3RvcjogXCJuYXJyb3dcIixcclxuICAgICAgICAgICAgICBsYWJlbDogXCJUZWxhIGluaWNpYWwgZG8gSG9yYU1lZFwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd29mZjIsd2VicCxqcGcsanBlZ31cIl0sXHJcbiAgICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrOiBcIi9pbmRleC5odG1sXCIsXHJcbiAgICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL2FwaS8sIC9eXFwvYXV0aC8sIC9eXFwvc3VwYWJhc2UvXSxcclxuICAgICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxyXG4gICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgICAgY2xlYW51cE91dGRhdGVkQ2FjaGVzOiB0cnVlLFxyXG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IG5ldyBSZWdFeHAoYF4ke2Vudi5WSVRFX1NVUEFCQVNFX1VSTD8ucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKSB8fCAnJ30vLipgLCAnaScpLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcInN1cGFiYXNlLWFwaS1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgbmV0d29ya1RpbWVvdXRTZWNvbmRzOiAxMCxcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMjAwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLig/OnBuZ3xqcGd8anBlZ3xzdmd8Z2lmfHdlYnApJC8sXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImltYWdlcy1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLig/OndvZmYyP3x0dGZ8b3RmfGVvdCkkLyxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZm9udHMtY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMjAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDM2NSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC4oPzpnb29nbGVhcGlzfGdzdGF0aWMpXFwuY29tXFwvLiovaSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZ29vZ2xlLWZvbnRzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDMwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgaW1wb3J0U2NyaXB0czogW1wiL3N3LW5vdGlmaWNhdGlvbnMuanNcIl0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgICBlbmFibGVkOiBtb2RlID09PSBcImRldmVsb3BtZW50XCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICBdLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIHRhcmdldDogJ2VzMjAxNScsXHJcbiAgICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgICBjb21wcmVzczoge1xyXG4gICAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLCAvLyBSZW1vdmUgY29uc29sZS5sb2dzIGluIHByb2R1Y3Rpb25cclxuICAgICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXHJcbiAgICAgICAgICBwdXJlX2Z1bmNzOiBbJ2NvbnNvbGUubG9nJywgJ2NvbnNvbGUuaW5mbycsICdjb25zb2xlLmRlYnVnJ10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xyXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZmlyZWJhc2UnKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdmaXJlYmFzZSc7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIEdyb3VwIGV2ZXJ5dGhpbmcgZWxzZSBpbnRvIHZlbmRvciB0byBlbnN1cmUgcm9idXN0IFJlYWN0IGV4ZWN1dGlvblxyXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIC8vIE9wdGltaXplIGNodW5rIGZpbGUgbmFtZXNcclxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJyxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXRcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAyMDAwLFxyXG4gICAgICAvLyBFbmFibGUgc291cmNlIG1hcHMgZm9yIHByb2R1Y3Rpb24gZGVidWdnaW5nIChvcHRpb25hbCwgcmVtb3ZlIGlmIG5vdCBuZWVkZWQpXHJcbiAgICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICB9LFxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIGV4Y2x1ZGU6IFtcIkBjYXBhY2l0b3IvY29yZVwiLCBcIkBjYXBhY2l0b3IvYXBwXCJdLFxyXG4gICAgICBpbmNsdWRlOiBbXHJcbiAgICAgICAgJ3JlYWN0JyxcclxuICAgICAgICAncmVhY3QtZG9tJyxcclxuICAgICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICAgJ2RhdGUtZm5zJyxcclxuICAgICAgICAnZnJhbWVyLW1vdGlvbicsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9SLFNBQVMsY0FBYyxlQUFlO0FBQzFULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUMxQyxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsVUFDYjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsUUFDQSxVQUFVO0FBQUEsVUFDUixNQUFNO0FBQUEsVUFDTixZQUFZO0FBQUEsVUFDWixhQUFhO0FBQUEsVUFDYixhQUFhO0FBQUEsVUFDYixrQkFBa0I7QUFBQSxVQUNsQixTQUFTO0FBQUEsVUFDVCxhQUFhO0FBQUEsVUFDYixPQUFPO0FBQUEsVUFDUCxXQUFXO0FBQUEsVUFDWCxJQUFJO0FBQUEsVUFDSixNQUFNO0FBQUEsVUFDTixLQUFLO0FBQUEsVUFDTCxPQUFPO0FB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
