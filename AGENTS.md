# HoraMed — Agent Guide

> **Last updated:** 2026-04-27  
> **Project language:** Portuguese (Brazil) — all user-facing text, comments, and docs are in Portuguese. Code identifiers use English.  
> **Repository:** https://github.com/leplonghi/horamed-AG

---

## 1. Project Overview

**HoraMed** is a cross-platform personal health assistant. It helps users manage medications, medical appointments, exams, vaccination records, health documents, and includes an AI health assistant named "Clara". The app is deployed as:

1. **Progressive Web App (PWA)** — primary distribution via Firebase Hosting at `https://app.horamed.net`
2. **Native Mobile Apps** — built with Capacitor for Android (AAB) and iOS
3. **Web Application** — accessible in any modern browser

The project is a private, commercial application. All rights reserved © 2026 HoraMed.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18.3 + TypeScript 5.8 |
| **Build Tool** | Vite 5.4 (SWC plugin for fast compilation) |
| **Styling** | Tailwind CSS 3.4 + tailwindcss-animate |
| **UI Components** | shadcn/ui (Radix UI primitives + class-variance-authority) |
| **Animations** | Framer Motion 12.23 |
| **Routing** | React Router DOM 7.6 |
| **State Management** | TanStack React Query 5.83 (server state) + React Context (client state) |
| **Forms** | React Hook Form 7.61 + Zod 3.25 |
| **Icons** | Phosphor Icons React (default weight: `duotone`, size: 24) |
| **Charts** | Recharts 2.15 |
| **PDF Generation** | jsPDF 4.0 + jspdf-autotable 5.0 |
| **Date Handling** | date-fns 3.6 + date-fns-tz 3.2 |
| **PWA** | vite-plugin-pwa (Workbox-based service worker) |
| **Mobile Wrapper** | Capacitor 7.4 (iOS + Android) |
| **Backend** | Firebase (Firestore, Auth, Storage, Functions, Cloud Messaging) |
| **Payments** | Stripe (via Firebase Cloud Functions) |
| **AI / OCR** | Google Gemini API (via Firebase Cloud Functions) |
| **Notifications** | Firebase Cloud Messaging + Capacitor Push/Local Notifications |
| **Biometric Auth** | `@aparajita/capacitor-biometric-auth` |
| **Ads** | Capacitor Community AdMob |

---

## 3. Directory Structure

```
horamed/
├── src/
│   ├── app/                    # App shell, providers, routing, query client
│   │   ├── AppProviders.tsx    # Context hierarchy wrapper
│   │   ├── AppShell.tsx        # Main router + navigation + global overlays
│   │   ├── queryClient.ts      # TanStack Query configuration
│   │   └── routes/             # Domain-based route modules (lazy-loaded)
│   │       ├── MedicamentosRoutes.tsx
│   │       ├── SaudeRoutes.tsx
│   │       ├── CarteiraRoutes.tsx
│   │       ├── PerfilRoutes.tsx
│   │       └── ConfigRoutes.tsx
│   ├── pages/                  # 68 page components (one per route)
│   │   └── internal/           # Admin/internal pages (e.g., CampaignGenerator)
│   ├── components/             # ~350 components organized by domain
│   │   ├── ui/                 # 50+ shadcn/ui base primitives
│   │   ├── common/             # Shared layout (PageLayout, SectionHeader, etc.)
│   │   ├── medications/        # Medication hub, cards, wizards
│   │   ├── medical-events/     # Appointments, exams, events
│   │   ├── cofre/              # Health document vault
│   │   ├── profile/            # Profile management UI
│   │   ├── health/             # Health tracking widgets
│   │   ├── fitness/            # Supplement & fitness features
│   │   ├── gamification/       # XP, streaks, achievements
│   │   ├── rewards/            # Premium rewards UI
│   │   ├── notifications/      # Notification settings & setup
│   │   ├── onboarding/         # Onboarding flows
│   │   ├── voice/              # Voice input & commands
│   │   ├── clara/              # AI assistant UI components
│   │   └── ... (symptoms, pharmacy, progress, celebrations, etc.)
│   ├── hooks/                  # 75 custom hooks (domain-specific data fetching)
│   ├── contexts/               # 5 React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── SubscriptionContext.tsx
│   │   ├── LanguageContext.tsx
│   │   ├── OnboardingContext.tsx
│   │   └── ProfileCacheContext.tsx
│   ├── integrations/firebase/  # Firebase client abstraction layer
│   │   ├── client.ts           # Firebase app initialization
│   │   ├── auth.ts             # Auth operations (email, Google, Capacitor native)
│   │   ├── firestore.ts        # Real-time hooks + CRUD helpers
│   │   └── index.ts            # Barrel export
│   ├── services/               # Higher-level business services
│   ├── infrastructure/         # Repository pattern + notification infra
│   ├── domain/                 # Domain layer (EventBus, AppBootstrapper)
│   ├── data/                   # Static data (Brazilian medications CSV)
│   ├── types/                  # Centralized TypeScript types
│   │   ├── dose.ts             # Dose types + safe parsing helpers
│   │   ├── profile.ts          # Profile types
│   │   └── index.ts            # Barrel exports
│   ├── lib/                    # Utilities (safeDateUtils, OCR, PDF, etc.)
│   ├── ai/                     # Client-side AI orchestration
│   │   ├── healthAgent.ts      # Intent classification + prompt building
│   │   ├── intentEngine.ts
│   │   ├── personaEngine.ts
│   │   └── handlers/           # Domain-specific prompt builders
│   ├── i18n/                   # Internationalization
│   │   └── locales/
│   │       ├── pt.json         # Primary language (~3,360 keys)
│   │       └── en.json
│   ├── config/                 # App configuration (beta testers, rewards)
│   ├── utils/                  # Small helpers (format, image compression)
│   └── tests/                  # Unit tests (Vitest)
│       ├── referral.test.ts
│       ├── useMedicationLimits.test.ts
│       └── useStreakCalculator.test.ts
├── functions/                  # Firebase Cloud Functions (Node.js)
│   ├── src/
│   │   ├── index.ts            # Main entry (~1,500 lines)
│   │   └── stripeHub.ts        # Stripe integration helpers
│   └── package.json
├── tests/e2e/                  # Playwright E2E tests
│   ├── guest-experience.spec.ts
│   ├── medication-flow.spec.ts
│   ├── pwa.spec.ts
│   └── smoke.spec.ts
├── android/                    # Capacitor Android project
├── ios/                        # Capacitor iOS project
├── public/                     # Static assets (icons, sounds, splash)
├── docs/                       # Project documentation
├── scripts/                    # Migration & utility scripts
├── supabase/                   # Legacy Supabase migrations (deprecated)
└── .agent/                     # Antigravity Kit (AI agent infrastructure)
```

**Scale:** ~597 TypeScript/TSX files in `src/`, ~6 in `functions/src/`.

---

## 4. Routing Architecture

Routes are organized by **domain modules** in `src/app/routes/`. All pages use `React.lazy()` for code splitting.

| Domain | Base Paths |
|--------|-----------|
| **Medicamentos** | `/rotina`, `/medicamentos`, `/estoque`, `/historico-medicamentos`, `/interacoes` |
| **Saúde** | `/saude/agenda`, `/consultas`, `/eventos-medicos`, `/carteira-vacina`, `/exames`, `/graficos`, `/emergencia`, `/viagem` |
| **Carteira** | `/carteira`, `/scan`, `/compartilhar/:token` |
| **Perfil** | `/perfil`, `/assinatura`, `/planos`, `/meu-progresso`, `/indique-ganhe` |
| **Config** | `/notificacoes-config`, `/alarmes`, `/ajuda`, `/privacidade`, `/termos` |

Protected routes wrap authenticated pages via `<ProtectedRoute>`. Navigation bar visibility is controlled per-route via `HIDE_NAVIGATION_PATHS` and `HIDE_NAVIGATION_PREFIXES` in `AppShell.tsx`.

---

## 5. State Management

| Type | Approach | Details |
|------|----------|---------|
| **Server State** | TanStack React Query | Real-time Firestore listeners via custom hooks (`useDocument`, `useCollection`, `useUserCollection`) |
| **Client State** | React Context | Auth, Subscription, Language, Onboarding, Profile Cache |
| **Cross-component** | Event Bus | Custom event bus in `src/domain/services/EventBus.ts` |
| **Local State** | useState / useReducer | Component-level state |

**Query Client Config** (`src/app/queryClient.ts`):
- Stale time: 2 minutes
- GC time: 30 minutes
- Refetch on window focus: **false** (Firebase uses real-time listeners)
- Refetch on reconnect: **true**
- Retry: 2 attempts with exponential backoff

---

## 6. Backend & Services

### Firebase Client (`src/integrations/firebase/`)
- Initialized from environment variables (`VITE_FIREBASE_*`)
- Functions region: `southamerica-east1` (São Paulo) for low latency
- Emulator support via `VITE_USE_FIREBASE_EMULATOR=true`
- Analytics and Messaging disabled in Capacitor native WebView

### Firebase Cloud Functions (`functions/src/index.ts`)
Key callable functions and triggers:
- `healthAssistant` — AI health assistant (Clara)
- `extractMedication`, `extractExam`, `extractDocument` — OCR endpoints
- `checkDrugInteractions` — Drug interaction checker
- `processVoiceCommand` — Voice command processor
- `createCheckoutSession`, `createCustomerPortalSession` — Stripe payments
- `stripeWebhook` — Stripe webhook handler
- `scheduleDoseNotifications` — Dose notification scheduler (Pub/Sub every 15 min)
- `sendCaregiverInvite`, `generateTravelDoses` — Caregiver & travel features

Rate limiting is enforced per user per hour via Firestore transactions:
- Health Assistant: 30 calls / hour
- OCR: 15 calls / hour

### Firestore Security Rules (`firestore.rules`)
- Users can only read/write their own documents
- Caregivers with `approved` status can read patient data and update specific dose fields
- Admin role check via `request.auth.token.admin == true`

### Supabase
Legacy backend with 50+ edge functions and migrations. Migration scripts exist in `scripts/` to move data to Firebase. Supabase is no longer the primary backend.

---

## 7. Build & Development Commands

```bash
# Development
npm run dev              # Vite dev server (localhost:8080)

# Build
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build

# Quality
npm run typecheck        # TypeScript check (tsc --noEmit)
npm run lint             # ESLint
npm run test             # Vitest unit tests

# i18n
npm run i18n:check       # Check translation completeness (Python script)

# Migration (Supabase → Firebase)
npm run migrate:export   # Export data from Supabase
npm run migrate:import   # Import data to Firebase
npm run migrate:storage  # Migrate storage files
npm run migrate:full     # Full migration pipeline

# Firebase
npm run firebase:deploy              # Deploy hosting + functions
npm run firebase:deploy:rules        # Deploy Firestore + Storage rules only

# Mobile
npx cap sync android
npx cap open android
npx cap sync ios
npx cap open ios
```

---

## 8. Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| **Unit Tests** | Vitest + jsdom + Testing Library | `src/tests/` |
| **E2E Tests** | Playwright | `tests/e2e/` |
| **Linting** | ESLint 9 (typescript-eslint) | Entire codebase |

**Existing Unit Tests:**
- `referral.test.ts`
- `useMedicationLimits.test.ts`
- `useStreakCalculator.test.ts`

**Existing E2E Tests:**
- `guest-experience.spec.ts`
- `medication-flow.spec.ts`
- `pwa.spec.ts`
- `smoke.spec.ts`

**Test Config:**
- Vitest uses `@vitejs/plugin-react-swc` and `@/` alias resolution
- Setup file: `src/setupTests.ts` (imports `@testing-library/jest-dom`)
- Playwright runs against `http://localhost:8080` with Chromium

---

## 9. Deployment Process

| Platform | Method |
|----------|--------|
| **Web / PWA** | Firebase Hosting (auto-deploy via GitHub Actions on push to `main`) |
| **Android** | GitHub Actions builds AAB → uploads artifact → publishes to Google Play (internal track) |
| **iOS** | Manual via `npx cap sync ios` + Xcode |
| **Cloud Functions** | Deployed alongside hosting via `firebase deploy` |

**CI/CD Workflows** (`.github/workflows/`):
1. **`deploy.yml`** — Firebase Hosting + Functions deploy + Android AAB build
2. **`build-android.yml`** — Standalone Android AAB build (on tags or specific branches)

**Firebase Hosting Config:**
- SPA rewrite to `index.html`
- Aggressive caching for assets (1 year)
- No-cache for `index.html`, `sw.js`, manifest files

---

## 10. Code Style & Conventions

### Absolute Rules (from `CODING_STANDARDS.md`)

1. **🚫 THE "NEW DATE" BAN** — Never use `new Date()` directly on external data. This is the #1 cause of crashes ("Invalid time value").
   - ✅ Use `safeDateParse()` / `safeGetTime()` from `@/lib/safeDateUtils`
   - ✅ For doses: `safeParseDoseDate(dose)` from `@/types`
   - ✅ For profiles: `safeParseProfileBirthDate(profile)` from `@/types/profile`

2. **Type-Specific Date Helpers** — Use dedicated helpers for domain objects rather than parsing manually.

3. **Centralized Types** — Import from `src/types/index.ts`. Use `DoseStatus` literal type, `ProfileType` variants, and type guards (`isDose()`).

4. **Undefined Property Protection** — Always use optional chaining (`?.`) with fallbacks. Never access nested properties without validation.

5. **Component Stability** — Handle loading states, wrap `useEffect` in try/catch, validate props, use existing calculation helpers.

6. **Self-Correction** — Mental check before pushing. `new Date()` in a PR = BLOCK.

### Additional Conventions

- **i18n:** No hardcoded Portuguese text in `.tsx` files. Use `useLanguage()` hook with `t('key')`. Run `npm run i18n:check` before PRs.
- **Design System:** All colors in HSL CSS variables. Glassmorphism cards with tier system. Fluid typography with `clamp()`.
- **Mobile-First:** Native app feel (no text selection, tap highlight removed, safe area insets, 44px touch targets).
- **Dark Mode:** Full theme support via `next-themes` + CSS variables.
- **Accessibility:** WCAG AA compliance for contrast, focus rings, reduced motion support.
- **Icons:** Default Phosphor Icons weight is `duotone`, size 24. Set globally in `IconContext.Provider`.

### ESLint Config
- Ignores: `dist`, `supabase`, `android`, `dev-dist`, `functions/lib`
- Rules: `@typescript-eslint/no-unused-vars` = off, `@typescript-eslint/no-explicit-any` = warn
- Plugins: `react-hooks`, `react-refresh`

---

## 11. Environment Variables

Create a `.env` file in the project root:

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Stripe (optional)
VITE_STRIPE_PUBLISHABLE_KEY=...

# Firebase Emulator (development only)
VITE_USE_FIREBASE_EMULATOR=true
```

---

## 12. Security Considerations

- **Stripe secret keys** live only in Firebase Cloud Functions environment variables — never in client code.
- **Firestore Security Rules** enforce user isolation and caregiver permissions.
- **Rate limiting** on all AI/OCR endpoints via Firestore transactions.
- **Keystore password** for Android is set via `HORAMED_KEYSTORE_PASSWORD` environment variable in CI/CD.
- **Firebase Admin** is initialized without explicit credentials in Cloud Functions (uses default service account).
- **Device fingerprinting** is used for fraud detection (`@fingerprintjs/fingerprintjs`).
- **No sensitive data** should be committed to the repository. `.env` and keystore files are `.gitignore`d.

---

## 13. Key Architectural Decisions

1. **Firebase-first backend** — Migrated from Supabase; real-time listeners replace polling.
2. **Capacitor over React Native** — Web-first with native wrappers for faster iteration.
3. **Stripe via Cloud Functions** — Secure payment processing server-side.
4. **Gemini for AI/OCR** — Single AI provider for chat, OCR, voice, and drug interactions.
5. **Domain-based route modules** — Scalable routing organization.
6. **Lazy loading everywhere** — Aggressive code splitting for fast initial load.
7. **PWA + Native hybrid** — Same codebase serves web users and app store users.

---

## 14. Agent Infrastructure (`.agent/`)

This project uses the **Antigravity Kit** — a comprehensive AI agent capability system:
- **20 Specialist Agents** (frontend, backend, mobile, security, QA, etc.)
- **36 Skills** (domain-specific knowledge modules)
- **11 Workflows** (`/brainstorm`, `/create`, `/debug`, `/deploy`, `/test`, etc.)
- See `.agent/ARCHITECTURE.md` for full details.

---

## 15. Troubleshooting

### Common Issues

**Cannot find module `@rollup/rollup-[os-arch]`**
1. Clear cache and reinstall: `rm -rf node_modules rm package-lock.json npm install`
2. Or install the specific Rollup binary: `npm install @rollup/rollup-win32-x64`
3. Ensure Node.js LTS is installed.

**Firebase emulator not connecting**
- Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env`
- Ensure emulators are running: `firebase emulators:start`

**Android build fails**
- Check `capacitor.config.ts` — `server.url` must be commented out for production
- Ensure `webContentsDebuggingEnabled` is `false` for Play Store release
- Verify keystore path and password

---

*This file is intended for AI coding agents. For human contributors, see `README.md`.*
