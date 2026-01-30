# 🚜 Plan: Complete Migration from Supabase to Firebase

**Goal**: Fully migrate the remaining ~90 files from Supabase to Firebase, ensuring no `supabase-js` dependencies remain.

**Status**: 🚧 Planning Phase

---

## 🛑 Critical Situation
`CODE_MIGRATION_PROGRESS.md` incorrectly states "100% Complete".
Reality: ~92 files still import/use `@/integrations/supabase/client`.

## 📂 Phase 1: Critical Hooks (Foundation)
These hooks are used across multiple pages and components. Migrating them first ensures stability.

- [ ] `src/hooks/useAuditLog.ts`
- [ ] `src/hooks/useConsents.ts`
- [ ] `src/hooks/useCriticalAlerts.ts`
- [ ] `src/hooks/useMedicationAlarm.ts`
- [ ] `src/hooks/useNotificationMetrics.ts`
- [ ] `src/hooks/useOverdueDoses.ts`
- [ ] `src/hooks/usePrescriptionControl.ts`
- [ ] `src/hooks/usePWAInstall.ts`
- [ ] `src/hooks/useResilientReminders.ts`
- [ ] `src/hooks/useSmartMedicationSuggestions.ts`
- [ ] `src/hooks/useStreakProtection.ts`
- [ ] `src/hooks/useVaccineReminders.ts`
- [ ] `src/hooks/useWeightInsights.ts`
- [ ] `src/hooks/useVaccinationRecords.ts`
- [ ] `src/hooks/useStreakCalculator.ts`
- [ ] `src/hooks/usePushNotifications.ts`
- [ ] `src/hooks/useMedicationInfo.ts`
- [ ] `src/hooks/useFeatureFlags.ts`
- [ ] `src/hooks/useCaregiverVaccineReminders.ts`
- [ ] `src/hooks/useBiometricAuth.ts`
- [ ] `src/hooks/useAndroidAlarm.ts`
- [ ] `src/hooks/useAILimits.ts`
- [ ] `src/hooks/useAchievements.ts`

## 📂 Phase 2: Core Pages
These pages are user-facing and currently rely on Supabase for data.

- [ ] `src/pages/SinaisVitais.tsx`
- [ ] `src/pages/Saude.tsx`
- [ ] `src/pages/Progress.tsx`
- [ ] `src/pages/ProfileEdit.tsx`
- [ ] `src/pages/ProfileCreate.tsx`
- [ ] `src/pages/Privacy.tsx`
- [ ] `src/pages/Plans.tsx` (Critical for Revenue)
- [ ] `src/pages/Pharmacy.tsx`
- [ ] `src/pages/NotificationSetup.tsx`
- [ ] `src/pages/NotificationSettings.tsx`
- [ ] `src/pages/Notifications.tsx`
- [ ] `src/pages/MyDoses.tsx`
- [ ] `src/pages/More.tsx`
- [ ] `src/pages/MedicalReports.tsx`
- [ ] `src/pages/MedicalAppointments.tsx`
- [ ] `src/pages/History.tsx`
- [ ] `src/pages/HealthTimeline.tsx`
- [ ] `src/pages/HealthDashboard.tsx`
- [ ] `src/pages/Emergency.tsx`
- [ ] `src/pages/AnalyticsDetails.tsx`
- [ ] `src/pages/AddItemWizard.tsx`

## 📂 Phase 3: Components
UI components that likely fetch data or manage state via Supabase.

- [ ] `src/components/HealthAssistantChat.tsx`
- [ ] `src/components/HealthCalendar.tsx`
- [ ] `src/components/ImprovedCalendar.tsx`
- [ ] `src/components/PaymentMethodModal.tsx`
- [ ] `src/components/DailySummaryModal.tsx`
- [ ] `src/components/DocumentOCR.tsx`
- [ ] `src/components/FeatureSpotlight.tsx`
- [ ] `src/components/onboarding/SmartOnboarding.tsx`
- [ ] ... and others.

## 📂 Phase 4: Verification & Cleanup
- [ ] Delete `src/integrations/supabase/`
- [ ] Uninstall `@supabase/supabase-js`
- [ ] Full E2E Test Run
- [ ] Update `CODE_MIGRATION_PROGRESS.md` to *finally* be 100%.

## 🛠 Migration Strategy
For each file:
1. Replace `import { supabase } ...` with `import { db, auth, functions } from '@/integrations/firebase'`.
2. Replace `supabase.from('table').select(...)` with `db.collection('users').doc(uid).collection('table')...`.
3. Replace `supabase.auth.user()` with `auth.currentUser`.
4. Ensure all async calls are properly awaited.
5. Use `users/{uid}/[collection]` pattern for data isolation.

