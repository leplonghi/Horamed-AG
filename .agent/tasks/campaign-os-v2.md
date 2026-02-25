# CampaignOS V2 Upgrade

## Objective
Enhance the Campaign Generator into a full "CampaignOS" with Strategy Management, Improved Flows, and clearer Save logic.

## Changes Implemented

### 1. Refactored `CampaignGenerator.tsx`
- **New Tab Structure:**
  - `config`: Enhanced Wizard (5 Steps).
  - `creative`: Preview & Save area.
  - `strategy`: **NEW** Weekly Strategy Manager.
  - `replies`: Magic Reply tool.
  - `dashboard`: Metrics & Active Campaigns.
- **Workflow Improvement:**
  - Separated "Generate Preview" from "Save Campaign".
  - Added "Draft" state visualization (Yellow banner if not saved).
  - Added explicit "Salvar Campanha" button.
- **Strategy Manager:**
  - Automatically generates a 7-day content plan based on the selected Niche.
  - Lists Focus, Format, and Topic for each day.

### 2. UI/UX Polish
- Used `framer-motion` for smooth transitions between tabs and wizard steps.
- improved empty states and loading/saving feedback.
- Clearer visual hierarchy with glassmorphism cards.

### 3. Backend Integration
- Verified `CampaignService.ts` correctly handles the new `metadata` fields in `CampaignRule`.
- ensured `createCampaign` is called only when the user confirms the preview.

## Next Steps
- [ ] Add "Edit" functionality for the generated copy before saving.
- [ ] Allow customizing the Weekly Strategy plan (drag & drop or text edit).
- [ ] Integrate Strategy Plan with Calendar View.
