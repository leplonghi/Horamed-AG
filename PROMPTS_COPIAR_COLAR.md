# HoraMed — Prompts Copiar e Colar para Cursor/Antigravity

---

## PROMPT 1 — Eliminar 74 gradients CSS

Contexto: src/index.css tem 74 ocorrências de "gradient" que causam reflow em Android e inconsistência visual. Precisamos reduzir para ≤15 usando tokens semânticos.

O que fazer:

1. Abrir tailwind.config.ts e adicionar dentro de theme.extend.backgroundImage:
'card-subtle': 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/0.3) 100%)',
'hero-primary': 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, hsl(var(--primary)/0.03) 100%)',
'hero-success': 'linear-gradient(135deg, hsl(142 76% 36%/0.08) 0%, hsl(142 76% 36%/0.03) 100%)',
'surface-glass': 'linear-gradient(135deg, hsl(var(--background)/0.9) 0%, hsl(var(--muted)/0.4) 100%)',

2. Abrir src/index.css e remover todas as linhas com "background: linear-gradient(" dentro de @layer base e @layer components. Manter apenas gradients que são parte do design system oficial.

3. Auditar componentes com gradients inline no className. Comando: grep -rn "from-blue-500.*via.*to-|from-indigo-.*to-" src/components src/pages --include="*.tsx" | wc -l
Para cada arquivo encontrado: se usa shouldReduceEffects, condicionar o gradiente a !shouldReduceEffects.

4. No final de src/index.css adicionar:
@media (prefers-reduced-motion: reduce), (prefers-contrast: more) {
  * {
    background-image: none !important;
    backdrop-filter: none !important;
  }
  .shadow-glass,
  [class*="blur-"] {
    box-shadow: none !important;
    filter: none !important;
  }
}

5. Validar com: grep -c "gradient" src/index.css
Resultado esperado: ≤ 15

---

## PROMPT 2 — Adicionar Caregiver Rules no Firebase

Contexto: firestore.rules não tem regras de cuidador. O app tem telas de caregiver mas qualquer acesso cross-user é bloqueado. Precisamos permitir cuidadores aprovados lerem dados do paciente.

O que fazer:

1. Abrir firestore.rules e após a função isAdmin() (linha ~21) adicionar:

function isCaregiverOf(userId) {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(userId)/caregivers/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(userId)/caregivers/$(request.auth.uid)).data.status == "approved";
}

2. Dentro do match /users/{userId} (após linha ~124) adicionar:

match /caregivers/{caregiverId} {
  allow read: if isOwner(userId);
  allow read: if request.auth.uid == caregiverId;
}

3. Atualizar as regras de medications e doses dentro de match /users/{userId}:

match /medications/{medicationId} {
  allow read: if isOwner(userId) || isCaregiverOf(userId);
  allow write: if isOwner(userId);
}

match /doses/{doseId} {
  allow read: if isOwner(userId) || isCaregiverOf(userId);
  allow update: if isCaregiverOf(userId) &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['taken', 'takenAt', 'updatedAt']);
  allow create, delete: if isOwner(userId);
}

4. Após o bloco de campaigns no firestore.rules adicionar:

match /sharedDocuments/{shareId} {
  allow read: if resource.data.expiresAt > request.time;
  allow create: if isAuthenticated() &&
    request.resource.data.ownerId == request.auth.uid &&
    request.resource.data.expiresAt is timestamp &&
    request.resource.data.expiresAt > request.time;
  allow delete: if isAuthenticated() &&
    resource.data.ownerId == request.auth.uid;
}

5. Criar arquivo src/services/shareDocumentService.ts com este código:

import { db } from "@/integrations/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface SharedDocument {
  ownerId: string;
  documentId: string;
  documentType: "medical_report" | "prescription" | "exam";
  expiresAt: Timestamp;
  createdAt: Timestamp;
  shareId?: string;
}

export async function createShareLink(
  ownerId: string,
  documentId: string,
  documentType: SharedDocument["documentType"],
  expiresInHours = 72
): Promise<string> {
  const expiresAt = Timestamp.fromMillis(
    Date.now() + expiresInHours * 60 * 60 * 1000
  );

  const ref = await addDoc(collection(db, "sharedDocuments"), {
    ownerId,
    documentId,
    documentType,
    expiresAt,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function revokeShareLink(shareId: string): Promise<void> {
  await deleteDoc(doc(db, "sharedDocuments", shareId));
}

6. Validar com: grep -c "isCaregiverOf|sharedDocuments" firestore.rules
Resultado esperado: ≥ 6

---

## PROMPT 3 — Adicionar Countdown ao vivo no HeroNextDose

Contexto: HeroNextDose mostra o horário da próxima dose estaticamente. Falta um contador regressivo que cria urgência e feedback temporal. Também falta corrigir a última animação height: "auto" em CampaignGenerator.tsx:742.

O que fazer:

1. Abrir src/components/HeroNextDose.tsx. Após as imports (linha ~12) adicionar:

import { memo, useCallback, useState, useEffect, useRef } from "react";

function useCountdown(targetDate: Date | null): string | null {
  const [display, setDisplay] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setDisplay(null);
      return;
    }

    const update = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setDisplay(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const totalMinutes = Math.floor(diff / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setDisplay(`${hours}h ${minutes}m`);
      } else if (totalMinutes > 0) {
        setDisplay(`${minutes}m ${seconds}s`);
      } else {
        setDisplay(`${seconds}s`);
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate]);

  return display;
}

2. Dentro da função HeroNextDose após const { shouldReduceEffects } = useDeviceCapability(); adicionar:

const doseDate = dose ? safeParseDoseDate(dose) : null;
const countdown = useCountdown(shouldReduceEffects ? null : doseDate);

3. No card principal onde o horário da dose é exibido, logo abaixo, adicionar:

{countdown && (
  <motion.span
    key={countdown}
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    className="text-xs font-mono text-blue-500/70 tabular-nums"
    aria-live="off"
    aria-label="tempo restante"
  >
    em {countdown}
  </motion.span>
)}

4. Abrir src/pages/internal/CampaignGenerator.tsx, ir para linha 742 e substituir:

ANTES:
<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">

DEPOIS:
<motion.div
  initial={{ opacity: 0, scaleY: 0.95, transformOrigin: "top" }}
  animate={{ opacity: 1, scaleY: 1 }}
  exit={{ opacity: 0, scaleY: 0.95 }}
  transition={{ duration: 0.2 }}
  className="overflow-hidden"
>

5. Validar com: grep -c "animate={{ height" src/pages/internal/CampaignGenerator.tsx
Resultado esperado: 0

---

## PROMPT 4 — Migrar Supabase Lotes 1-3 (15 arquivos)

Contexto: 34 arquivos ainda usam supabase. Dividir em 2 prompts. Este cobre gamification (4), calendários (5) e notificações (6).

Padrão de migração:
supabase.from('table').select('*') → getDocs(collection(db, 'table'))
supabase.from('table').insert({...}) → addDoc(collection(db, 'table'), {...})
supabase.from('table').update({...}).eq(id) → updateDoc(doc(db, 'table', id), {...})
supabase.from('table').delete().eq(id) → deleteDoc(doc(db, 'table', id))
supabase.functions.invoke('fn', {body}) → httpsCallable(functions, 'fn')(body)
supabase.storage.from('bucket').upload(...) → uploadBytes(ref(storage, path), file)

Arquivos a migrar:

GAMIFICATION (4):
- src/components/gamification/WeeklyLeaderboard.tsx
  Substituir supabase.from('leaderboard').select('*').order('xp', {ascending: false}).limit(10)
  Por: getDocs(query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(10)))

- src/components/gamification/DailyChallenges.tsx
  Substituir query Supabase por getDocs(collection(db, 'challenges')) filtrado por where('date', '==', today)

- src/components/gamification/FamilyLeaderboard.tsx
  Substituir por query na subcoleção users/{uid}/familyProfiles + merge de XP

- src/components/gamification/WeeklyChallenges.tsx
  Mesmo padrão do DailyChallenges com filtro de semana

CALENDÁRIOS (5):
- src/components/HealthCalendar.tsx
- src/components/ImprovedCalendar.tsx
- src/components/MiniWeekCalendar.tsx
- src/components/MonthlyProgressCalendar.tsx
- src/components/MonthlyReportCard.tsx

Todos precisam fazer query de doses/medications por período:
const q = query(
  collection(db, `users/${uid}/doses`),
  where('scheduledDate', '>=', startOfMonth),
  where('scheduledDate', '<=', endOfMonth)
);
const snap = await getDocs(q);
const doses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

NOTIFICAÇÕES (6):
- src/components/NotificationDiagnostics.tsx
- src/components/NotificationMetrics.tsx
- src/components/NotificationPermissionPrompt.tsx
- src/components/NotificationSettingsReminder.tsx
- src/components/VaccineNotificationSettings.tsx
- src/pages/Notifications.tsx

Todos leem/escrevem em users/{uid}/notificationMetrics ou users/{uid}/pushSubscriptions.
Se algum chama supabase.functions.invoke, substituir por:
import { getFunctions, httpsCallable } from "firebase/functions";
const functions = getFunctions();
const sendNotification = httpsCallable(functions, 'sendNotification');
await sendNotification({ userId: uid, ...payload });

Validar com: grep -rl "supabase" src/components/gamification src/components/HealthCalendar.tsx src/components/ImprovedCalendar.tsx src/components/MiniWeekCalendar.tsx src/components/MonthlyProgressCalendar.tsx src/components/MonthlyReportCard.tsx src/components/NotificationDiagnostics.tsx src/components/NotificationMetrics.tsx src/components/NotificationPermissionPrompt.tsx src/components/NotificationSettingsReminder.tsx src/components/VaccineNotificationSettings.tsx src/pages/Notifications.tsx 2>/dev/null | wc -l

Resultado esperado: 0

---

## PROMPT 5 — Migrar Supabase Lotes 4-6 + Remover @supabase (19 arquivos)

Contexto: Completar migração dos 19 arquivos restantes e remover dependência supabase-js do projeto.

ONBOARDING (4):
- src/components/onboarding/OnboardingStepNotifications.tsx
- src/components/onboarding/SmartOnboarding.tsx
- src/components/OnboardingScreens.tsx
- src/components/OnboardingTour.tsx

Padrão: salvar passo concluído
await updateDoc(doc(db, 'users', uid), {
  'onboarding.stepsCompleted': arrayUnion(stepName),
  'onboarding.completedAt': stepName === 'final' ? serverTimestamp() : null,
});

HOOKS (7):
- src/hooks/useAchievements.ts → ler de users/{uid}/achievements
- src/hooks/useAndroidAlarm.ts → chamar Cloud Function via httpsCallable
- src/hooks/useCaregiverVaccineReminders.ts → ler de users/{uid}/vaccinations com isCaregiverOf
- src/hooks/useSmartMedicationSuggestions.ts → chamar Gemini via Cloud Function
- src/hooks/useVaccinationRecords.ts → ler/escrever users/{uid}/vaccinations
- src/hooks/useVaccineReminders.ts → ler users/{uid}/vaccinations + criar reminders
- src/hooks/useWeightInsights.ts → ler users/{uid}/weightHistory

COMPONENTES MISTOS (8):
- src/components/DocumentOCR.tsx (ATENÇÃO: usa supabase.functions.invoke para OCR)
  Substituir por: const extractText = httpsCallable(functions, 'extractDocumentText'); const result = await extractText({ imageBase64, mimeType });

- src/components/FeatureSpotlight.tsx
- src/components/GuidedTour.tsx
- src/components/PaymentMethodModal.tsx (Stripe direto, migrar salvar método para Cloud Function)
- src/components/PrescriptionBulkAddWizard.tsx
- src/components/profile/ProfileStatsGrid.tsx (ler stats agregadas de users/{uid} documento raiz)
- src/components/SmartInsightsCard.tsx
- src/integrations/supabase/client.ts (último arquivo a deletar)

Após todos os 34 arquivos migrados, executar em terminal:

1. Confirmar que não há mais imports:
grep -rl "supabase" src/ --include="*.ts" --include="*.tsx"
Resultado esperado: 0

2. Remover diretório de integração:
rm -rf src/integrations/supabase/

3. Remover dependência:
npm uninstall @supabase/supabase-js

4. Confirmar bundle menor:
npm run build -- --report

Validar com: grep -rl "supabase" src/ --include="*.ts" --include="*.tsx" | wc -l
Resultado esperado: 0

---

## Resumo

P1 → 74 gradients → ≤15 (UI/UX 7.5→9.0)
P2 → caregiver rules + shareDocuments (Segurança 7.0→9.0)
P3 → countdown ao vivo + corrigir altura (Core Loop 7.0→8.5)
P4 → Supabase lotes 1-3 (Arquitetura 6.5→8.0)
P5 → Supabase lotes 4-6 + remover package (Arquitetura 8.0→9.5)

Nota esperada ao final: 9.2/10
