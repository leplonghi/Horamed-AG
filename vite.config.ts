import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";

// Read version from package.json at build time
const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

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
    define: {
      __APP_VERSION__: JSON.stringify(version),
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
              type: "image/png",
            },
            {
              src: "/pwa-192x192.png?v=10",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png?v=10",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/apple-touch-icon.png?v=10",
              sizes: "180x180",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icon-512.png?v=10",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon-1024.png?v=10",
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
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp,jpg,jpeg}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
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
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: false,
        },
      },
      rollupOptions: {
        output: {
          // Removed fragile manualChunks config that forced react into a generic vendor chunk.
          // Vite's default chunking strategy safely splits imports and respects execution order,
          // preventing "Cannot read properties of undefined (reading 'useState')" errors.
          // Optimize chunk file names
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 5000,
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
