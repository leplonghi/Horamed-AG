# Clinical Brief & Symptom Tracker
**Goal:** Implement a compliant, smart Symptom Tracker combined with a highly visual, 1-page "Clinical Brief" export designed exclusively to bring maximum clarity to a 15-minute doctor consultation, while strictly positioning HoraMed as an observation tool and not a diagnostic device.

## 1. Core Principles
*   **Compliance First:** At no point will the app diagnose or offer medical advice. All insights are framed as "observations" or "logged symptoms." Disclaimers will be universally visible on all exports.
*   **Speed for the Patient:** Logging a symptom must take under 10 seconds.
*   **Value for the Doctor:** The Clinical Brief must be scannable in 30 seconds, leading with the most relevant changes (adherence drops, new symptoms).
*   **Universal Relevance:** This feature doesn't rely on external hardware (like BP monitors), making it universally applicable to all users taking any medication.

## 2. Feature Scope
### A. The Daily "How Are You?" Check-In (Symptom Logger)
*   **UI/UX:** A beautifully designed widget on the dashboard asking "How are you feeling today?"
*   **Quick Logging:** 3 simple emojis (Great, Okay, Poor).
*   **Detail Selection:** If "Okay" or "Poor" is selected, a sleek drawer slides up with common symptoms (Headache, Nausea, Dizziness, Fatigue, Muscle Pain, etc.) and an "Other" text field.
*   **Severity Rating:** Mild, Moderate, Severe toggles.
*   **Safe Correlation Engine (Client-Side):** If the user logs a symptom that happens to be a known side-effect of a medication they took in the last 24h, we append a *neutral note*: `Note: This is a known potential side effect of [Medication Name]. Mention this during your next visit.`

### B. The "Clinical Brief" Export (For the Doctor)
*   **UI/UX:** A dedicated "Doctor Visit" or "Export Brief" button.
*   **Output:** A cleanly formatted, premium PDF design (avoiding the banned colors, using Emerald/Teal).
*   **Sections:**
    1.  **Patient Header:** Name, Age, Report Date Range (e.g., Last 30 Days).
    2.  **Disclaimer:** "This brief is a patient-generated log and is not a medical diagnosis. Intended for discussion purposes only."
    3.  **Medication Adherence Score:** A clear percentage (e.g., 94%) with a mini trendline.
    4.  **Current Active Medications:** A bulleted list of current meds and dosages.
    5.  **Reported Symptoms / Anomalies:** "Patient reported [Symptom] on [Dates]. Severity: [Moderate]."
*   **Generation Utility:** We will leverage `jspdf` and `jspdf-autotable` (already in `package.json`) to craft this beautifully.

## 3. Implementation Steps
### Phase 1: Data Model Updates (Firebase)
*   Update the Firestore schema or create a new collection for `symptom_logs`.
*   Fields: `id`, `user_id`, `date`, `general_feeling` (great/okay/poor), `symptoms` (array of strings), `severity` (string), `notes` (string), `correlated_medications` (array of strings, optional).

### Phase 2: UI - The Daily Check-In
*   Create a new component `DailyCheckInWidget.tsx` for the main dashboard.
*   Create a drawer/modal `SymptomLoggerModal.tsx` for capturing details.
*   Ensure premium styling (glassmorphism, Emerald/Teal tones, crisp icons from `lucide-react`).

### Phase 3: The Safe Correlation Engine
*   Create a utility function `analyzeSymptomCorrelation(symptoms, activeMedications)` that checks against a local or basic map of common side effects.

### Phase 4: The Clinical Brief Generator
*   Create `ClinicalBriefGenerator.tsx` or expand the existing `monthlyReport.ts`.
*   Design the PDF layout specifically for A4 paper. Focus heavily on typographic hierarchy and white space so the doctor can read it instantly.
*   Include the strict legal disclaimers.

### Phase 5: Testing & Audit
*   Run the UX audit script to ensure no purple is used and all contrast ratios are respected.
*   Run the Lint and Test scripts.
