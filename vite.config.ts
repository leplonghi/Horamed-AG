import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: false,
      hmr: {
        overlay: true,
      },
      watch: {
        usePolling: false,
      },
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
          "apple-touch-icon.png",
        ],
        manifest: {
          name: "HoraMed - Gestão Completa da Sua Saúde",
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
              type: "image/png",
            },
            {
              src: "/apple-touch-icon.png?v=3",
              sizes: "180x180",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icon-512.png?v=3",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon-1024.png?v=3",
              sizes: "1024x1024",
              type: "image/png",
            },
          ],
          categories: ["health", "medical", "lifestyle"],
          prefer_related_applications: false,
          display_override: ["standalone", "minimal-ui"],
          handle_links: "preferred",
          launch_handler: {
            client_mode: "navigate-existing",
          },
          screenshots: [
            {
              src: "/screenshots/home.png",
              sizes: "390x844",
              type: "image/png",
              form_factor: "narrow",
              label: "Tela inicial do HoraMed",
            },
          ],
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
              urlPattern: new RegExp(`^${env.VITE_SUPABASE_URL?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''}/.*`, 'i'),
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "fonts-cache",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
          importScripts: ["/sw-notifications.js"],
        },
        devOptions: {
          enabled: mode === "development",
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase';
              }
              // Group everything else into vendor to ensure robust React execution
              return 'vendor';
            }
          },
          // Optimize chunk file names
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 2000,
      // Enable source maps for production debugging (optional, remove if not needed)
      sourcemap: false,
    },
    optimizeDeps: {
      exclude: ["@capacitor/core", "@capacitor/app"],
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'date-fns',
        'framer-motion',
      ],
    },
  };
});
