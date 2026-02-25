# PROMPT SEQUENCE: REPLICATING "KAMP AGENCY"

Use this sequence of prompts in AI Studio (or ChatGPT/Claude) to build the complete application step-by-step without breaking the code.

---

## 📢 PROMPT 1: SETUP & FOUNDATION (THE BRAIN)

**Instruction:**
"Act as a Senior React Engineer. We are building 'KAMP Agency', a marketing campaign generator.
First, creating the logic layer. Create a file named `src/lib/types.ts` and `src/lib/logic.ts`.

1.  **Define these Types inside `types.ts`:**
    *   `NicheType` ('saas', 'ecommerce', 'services', etc.)
    *   `ToneType` ('urgent_fomo', 'educational_authority', etc.)
    *   `CampaignGoal` ('weekly_planner', 'flash_launch', etc.)
    *   `BusinessIdentity` (productName, painPoint, benefit, etc.)
    *   `GeneratedCampaign` (code, link, copy, metadata).

2.  **Create the Predictive Logic in `logic.ts`:**
    *   Implement `getRecommendations(niche)` that returns defaults (e.g., SaaS -> Social/Educational).
    *   Implement `generateWeeklyStrategy(niche)` that returns an array of 7 strategy objects (Day, Focus, Format, Topic).
    *   Implement `generateCampaignCopy` that accepts `(niche, goal, business, tone)` and returns a string template with placeholders filled (e.g., 'Stop struggling with ${painPoint}').

**Constraint:** Do not build any UI yet. Only output the robust Logic and Type definitions."

---

## 📢 PROMPT 2: ASSETS & DESIGN SYSTEM (THE SOUL)

**Instruction:**
"Now let's define the content and visual tokens.

1.  **Create `src/lib/prompts.ts`:**
    *   Create a constant `PROMPTS_LIBRARY` array containing high-quality prompt templates (VEO video descriptions, Viral scripts, Twitter threads).
    *   *Example:* 'ID: ED-001, Category: Education, Content: Close-up of hand holding pill...'.

2.  **Create `src/styles/globals.css` (Tailwind Config):**
    *   Define these CSS variables in `:root`:
        *   `--primary`: `200 90% 50%` (Ocean Blue)
        *   `--gradient-fluid`: `linear-gradient(135deg, hsl(210 100% 50%), hsl(195 100% 50%), hsl(175 100% 45%))`
        *   `--glass-bg`: `rgba(255, 255, 255, 0.4)`
        *   `--glass-border`: `rgba(255, 255, 255, 0.2)`
        *   `--glass-shadow`: `0 8px 32px rgba(0, 0, 0, 0.1)`

**Constraint:** Ensure the prompts are detailed and the CSS uses modern HSL values compatible with Shadcn/UI."

---

## 📢 PROMPT 3: BASE COMPONENT & NAVIGATION (THE SKELETON)

**Instruction:**
"Now we build the Main React Component.

1.  **Create `src/app/page.tsx` (or `Generator.tsx`):**
    *   Imports: `useState` (React), `motion` (Framer Motion), `Lucide` icons.
    *   State: `activeTab` ('overview', 'create', 'tools'), `wizardStep`, `businessContext`.
    *   **Structure:**
        *   A Header: 'KAMP AGENCY' logo.
        *   **Navigation:** A `TabsList` containing 3 'Pill-shaped' triggers: 'Visão Geral', 'Criar Campanha', 'Ferramentas'.
    *   **Logic:** Defaults `activeTab` to 'overview'.

2.  **Implement 'Overview' Tab:**
    *   Show 3 Metric Cards (Active Campaigns, Total Redemptions, Conversion).
    *   Show a 'Campaigns List' (mock data is fine for now).

**Constraint:** Use the glassmorphism styles from step 2. Do NOT implement the Wizard logic yet, just the layout skeleton."

---

## 📢 PROMPT 4: THE WIZARD ENGINE (THE CORE FEATURE)

**Instruction:**
"Let's implement the 'Create' tab (The Wizard).

*   **Edit `src/app/page.tsx`**:
*   **Step Logic:**
    *   Create a `wizardState` object.
    *   Implement **Step 1 (DNA)**: Inputs for `ProfileName`, `Niche` (5 cards), `PainPoint`, `Benefit`.
        *   *Auto-fill:* When Niche is clicked, pre-fill identity fields if empty.
    *   Implement **Step 2 (Goal)**: 5 Cards for `CampaignGoal`.
    *   Implement **Step 3 (Tone)**: 5 Cards for `ToneType`.
    *   Implement **Step 4 (Review)**: A summary screen with a 'Generate' button.
*   **Animation:** Wrap steps in `AnimatePresence` for smooth transitions.

**Constraint:** Ensure validation prevents moving to the next step if fields are empty."

---

## 📢 PROMPT 5: THE GENERATION RESULT (THE PAYOFF)

**Instruction:**
"Now handle the 'Generate' action and the Detailed View.

1.  **Implement `handlePreview` function:**
    *   Call `generateCampaignCopy` and `generateWeeklyStrategy` from Prompt 1.
    *   Set a `generatedData` state.
    *   Change `activeTab` to `'detail_view'`.

2.  **Create the 'Detail View' (Contextual Tab):**
    *   This view replaces the main tabs when active.
    *   **Layout:**
        *   Header: Campaign Code (e.g., FLASH_99) & Link.
        *   **Sub-Tabs:** 'Overview', 'Schedule', 'Copy', 'Creative'.
        *   **Content:**
            *   *Overview:* Display DNA & Visual Theme.
            *   *Schedule:* Render the 7-day grid from `strategyPlan`.
            *   *Copy:* Display the generated text in a `Textarea` with a 'Copy' button.

**Constraint:** Make sure the user can click 'Back to Dashboard' to exit this view."

---

## 📢 PROMPT 6: PERSISTENCE & POLISH (THE FINISH LINE)

**Instruction:**
"Finally, add persistence and polish.

1.  **Profile Management:**
    *   Add `localStorage` logic to save/load Business Profiles in Step 1.
    *   Add a 'Save Profile' button.

2.  **Tools Tab (Magic Reply):**
    *   Implement a simple text area that accepts a customer question and outputs an AI response based on keywords (Price -> 'It's cheap', Error -> 'Sorry').

3.  **Refinement:**
    *   Ensure all buttons are 'pill-shaped' and have hover effects.
    *   Verify that clicking 'New Campaign' resets the Wizard to Step 0.

**Final Constraint:** Ensure the entire code is robust, typed, and error-free."
