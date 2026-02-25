# KAMP Agency: AI Studio Replication Spec

This document is a complete system specification for replicating the "KAMP Agency" application in Google AI Studio or similar LLM environments. It contains the **Role**, **Logic**, **Data Structures**, and **UI Components** required to simulate or build the application.

---

## 1. System Role & Identity

**Role:** KAMP Agency Architect
**Mission:** To generate comprehensive, niche-specific marketing campaigns (copy, schedules, creative briefs) for businesses using a deterministic predictive engine.
**Personality:** Professional, creative, data-driven, and highly organized.

---

## 2. Core Logic (The Brain)

This logic determines how inputs (Niche, Goal) are converted into outputs (Campaigns).

### A. Predictive Matrix (`getRecommendations`)
The system maps a user's **Niche** to specific default settings to minimize friction.

| Niche | Default Channel | Default Tone | Default Purpose | Default Post Type |
| :--- | :--- | :--- | :--- | :--- |
| **SaaS / App** | Social Mean (Feed) | Educational / Authority | Educational Tips | Engagement |
| **E-commerce** | Social Media | Urgent / FOMO | Marketing Promo | Flash Sale |
| **Infoproduct** | Email Marketing | Emotional / Story | Educational Tips | Keyword DM |
| **Real Estate** | WhatsApp | Premium / Aspirational | Informative News | Flash Sale |
| **Services** | WhatsApp | Educational / Authority | Educational Tips | Reply Pack |

### B. Business Identity State
The system MUST maintain this context for every generation:
```typescript
interface BusinessIdentity {
    productName: string;      // e.g., "Dr. Smith Clinic"
    description: string;      // e.g., "Dental services"
    targetAudience: string;   // e.g., "Families"
    painPoint: string;        // e.g., "Fear of dentist"
    benefit: string;          // e.g., "Pain-free treatment"
}
```

### C. Strategy Engine (`generateWeeklyStrategy`)
Generates a 7-day content plan based on the niche.

**Common Template:**
1.  **Mon:** Problem Focus (Reels)
2.  **Tue:** Educational Solution (Carousel)
3.  **Wed:** Social Proof (Testimonial)
4.  **thu:** Indirect Offer (Stories)
5.  **Fri:** Direct Sales (Video/Live)
6.  **Sat:** Lifestyle (Personal Photo)
7.  **Sun:** Engagement (Meme/Poll)

**Variations:**
*   *SaaS*: Monday focus = "The Bug/Workflow Issue".
*   *Ecommerce*: Friday focus = "Flash Coupon / Free Shipping".

---

## 3. Data Models (Typescript)

Use these interfaces to structure the data:

```typescript
type CampaignGoal = "weekly_planner" | "flash_launch" | "engagement_boost" | "authority_building" | "single_post";

interface GeneratedCampaign {
    code: string;           // Unique ID (e.g., FLASH_123)
    link: string;           // Direct redemption link
    copy: string;           // Full text body
    metadata: {
        niche: string;
        tone: string;
        goal: CampaignGoal;
        createdAt: string;
    }
}

interface CampaignRule {
    code: string;
    type: string;
    maxRedemptions: number;
    benefitDays: number;    // How long the promo lasts
}
```

---

## 4. UI Architecture (The Interface)

The application is split into **3 Main Tabs** and **1 Contextual View**.

### Tab 1: Overview (Dashboard)
*   **Metrics Cards**:
    *   Active Campaigns (Count)
    *   Total Redemptions (Count)
    *   Conversion Rate (%)
*   **Campaign List**: A list of saved campaigns with "Edit" buttons.

### Tab 2: Create (The Wizard)
A 4-step linear process:

**Step 1: DNA (Identity)**
*   **Profile Selector**: Dropdown to load saved profiles (localStorage `kamp_profiles`).
*   **Niche Selection**: 5 Cards (SaaS, Ecommerce, Info, Services, Real Estate).
    *   *Interaction*: Selecting a niche AUTOFILLS the Business Identity fields if empty.
*   **Identity Fields**: Product Name, Target Audience, Pain Point, Benefit.

**Step 2: Goal**
*   **Selection**: 5 Cards (Weekly Planner, Flash Launch, Engagement, Authority, Single Post).
*   **Conditional Input**: If "Flash Launch" is selected, show "Irresistible Offer" input.

**Step 3: Tone of Voice**
*   **Selection**: 5 Cards (Urgent, Emotional, Educational, Funny, Premium).

**Step 4: Review**
*   **Action**: "Generate Campaign" button (Simulates 1.5s loading).

### Tab 3: Tools
*   **Magic Reply**: A text area to paste a customer question.
    *   *Logic*:
        *   Contains "price"? -> "It's affordable! Less than a coffee/day."
        *   Contains "error"? -> "Sorry! Let's fix that. DM me?"
        *   Contains "good"? -> "Glad you liked it!"

### Contextual View: Campaign Details
*   **Trigger**: Opens after Wizard generation or editing a campaign.
*   **Layout**:
    *   **Header**: Campaign Code & Link.
    *   **Tabs**:
        1.  **Overview Visualization**: DNA summary & Visual Theme card.
        2.  **Schedule**: The 7-day strategy grid.
        3.  **Flows**: Customer journey map (Attraction -> Connection -> Conversion).
        4.  **Copy**: The generated text content with "Copy" buttons.
        5.  **Creative**: Visual briefs for designers/editors.

---

## 5. Visual Design System

*   **Primary Color**: `hsl(200, 90%, 50%)` (Ocean Blue)
*   **Style**: Glassmorphism (`bg-white/40 backdrop-blur-md`).
*   **Typography**: Clean sans-serif (Inter).
*   **Components**: Rounded corners (`rounded-2xl`), pill-shaped tabs (`rounded-full`).

---

## 6. Prompt Library (Content Assets)

The system draws from a database of "Prompts" (`PROMPTS_LIBRARY`).

**Example Asset (VEO - Education):**
```yaml
id: "ED-001"
title: "Myth vs Truth"
platform: "veo"
content: |
  initial_frame: Close-up of hand holding pill + milk.
  final_frame: Pill next to water. Red X on milk.
  motion: Static camera with slight zoom.
```

**Example Asset (Viral - POV):**
```yaml
id: "VIRAL-001"
title: "POV: Forgot Meds"
platform: "veo"
content: |
  initial_frame: POV looking at empty plate. Clock shows 20:00.
  final_frame: Giant notification "YOU FORGOT!" appears. Shake effect.
```

---

## 7. Execution FLow

1.  **User** opens App -> Sees **Overview**.
2.  **User** clicks "Create Campaign" (Tab 2).
3.  **User** selects Profile ("My Clinic"), Niche ("Services"), fills Identity.
4.  **User** selects Goal ("Weekly Planner").
5.  **User** selects Tone ("Educational").
6.  **System** runs `generateCampaignCopy` + `generateWeeklyStrategy`.
7.  **System** switches view to **Campaign Details**.
8.  **User** reviews 7-day plan, copies text, and clicks "Save".
9.  **System** saves to Firestore (`activeCampaigns`) and returns to **Overview**.

