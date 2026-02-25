# KAMP Agency: Clone Blueprint 🚀

This document is a comprehensive guide to extracting the **KAMP Agency (Campaign Generator)** feature from HoraMed and rebuilding it as a standalone application ("KAMP App").

## 1. Core Architecture

The "App" is currently a Single Page Application (SPA) feature hidden inside a larger platform. To clone it, you need to replicate its three main layers:

1.  **The Engine (Logic)**: Deterministic string replacement & template engines (`CampaignService.ts`, `prompts-data.ts`).
2.  **The Interface (UI)**: React + Tailwind + Framer Motion (`CampaignGenerator.tsx`).
3.  **The Memory (DB)**: Firebase Firestore (for saving campaigns and profiles).

---

## 2. Technical Stack (Required)

Start a new project using this stack to ensure compatibility with the existing code:

*   **Framework**: React (Vite) or Next.js (App Router recommended for SEO/standalone).
*   **Styling**: Tailwind CSS.
*   **UI Library**: Shadcn/UI (Radix Primitives).
*   **Animations**: Framer Motion.
*   **Icons**: Lucide React.
*   **Database**: Firebase (Firestore) or LocalStorage (for MVP).

### Quick Start
```bash
npx create-next-app@latest kamp-agency --typescript --tailwind --eslint
cd kamp-agency
npx shadcn-ui@latest init
```

---

## 3. Dependencies

Install the core libraries referenced in the code:

```bash
npm install framer-motion lucide-react sonner date-fns
```

Install the specific Shadcn components used in the UI:

```bash
npx shadcn-ui@latest add card button input label select tabs badge progress radio-group checkbox textarea toast
```

---

## 4. File Migration Strategy

You need to extract and copy specific files. Here is the mapping:

### A. The "Brains" (Logic & Data)
*   **Source**: `src/services/CampaignService.ts`
*   **Destination**: `src/lib/services/kamp-service.ts`
*   **Action**: Copy the types (`CampaignRule`, `CampaignStrategy`) and the `generateCode` logic. If moving to a standalone app, you might want to strip the Firebase implementation if you are just building a frontend demo first, or keep it if connecting to a new Firebase project.

*   **Source**: `src/pages/internal/prompts-data.ts`
*   **Destination**: `src/lib/data/prompts.ts`
*   **Action**: Copy the `PROMPTS_LIBRARY` array. This contains the "AI" templates for VEO, Viral POV, etc.

### B. The "Face" (Design System)
*   **Source**: `src/index.css` (specifically the root variables)
*   **Destination**: `src/app/globals.css`
*   **Action**: You **MUST** copy the CSS variables for:
    *   `--gradient-fluid` (The specific blue/cyan gradient).
    *   `--glass-*` classes (The glassmorphism effects).
    *   The font settings (Inter/Plus Jakarta Sans).

### C. The "Body" (Main Component)
*   **Source**: `src/pages/internal/CampaignGenerator.tsx`
*   **Destination**: `src/app/page.tsx` (or `src/components/kamp/Generator.tsx`)
*   **Refactoring Advice**: The current file is 1000+ lines. When cloning, split it into 3 sub-components:
    1.  `KampWizard.tsx` (Steps 1-4)
    2.  `KampDashboard.tsx` (Overview & Detail View)
    3.  `MagicReplyTool.tsx` (The Tools tab)

---

## 5. Critical Logic to Preserve

### 1. The "Predictive Engine"
Located inside `CampaignGenerator.tsx`, specifically the `getRecommendations` function. This logic maps the user's Niche (`saas`, `services`) to specific Tones and Post Types.
*   *Why it matters*: This is what makes the tool feel "smart" without actually using an LLM API call for every click.

### 2. The Deterministic Generator
The `generateCampaignCopy` function takes the inputs and fills in the text templates.
*   *Keep it*: This ensures instant generation (0ms latency) and avoids "Token Limit" errors from OpenAI APIs.

### 3. Profile Persistence
The `profiles` state and `localStorage` logic.
*   *Keep it*: Essential for users managing multiple clients (e.g., "Dr. Smith" vs "Pizza Place").

---

## 6. Standalone Database Schema (Firestore)

If you connect this to a real backend, create these collections:

**Collection: `campaigns`**
```typescript
{
  id: string; (auto-generated or custom code like FLASH_123)
  createdAt: timestamp;
  metadata: {
    niche: string;
    tone: string;
    copy: string; (The generated full text)
  };
  isActive: boolean;
  userId: string; (Link to the owner)
}
```

**Collection: `user_profiles`** (New)
*   Store the "Business Identity" (Name, Pain Point, Benefit) here so it persists across sessions.

---

## 7. Next Steps to Launch

1.  **Initialize Project**: Run the Next.js setup.
2.  **Copy Assets**: Move the `prompts-data.ts` and `CampaignService.ts` files.
3.  **Port the UI**: Copy the `CampaignGenerator.tsx` return JSX into your main page.
4.  **Fix Imports**: Update imports to point to your new shadcn/ui folder structure.
5.  **Style It**: Copy the CSS variables to `globals.css` to get the "Premium" look.
6.  **Deploy**: Push to Vercel.

**Success Metric**: You should have a working URL where a user can enter "Dentist", click "Generate", and see a full 7-day marketing plan instantly.
