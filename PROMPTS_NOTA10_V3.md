# HoraMed — Prompts Nota 10 V3
> Gerado em 12/04/2026 com base em auditoria real do código.  
> Placar atual: **7.4 / 10**  
> Execute os prompts na ordem 1 → 5. Cada prompt tem contexto, arquivo exato e código esperado.

---

## PROMPT 1 — CSS: Eliminar 74 gradients redundantes

**Camada:** UI/UX · **Impacto:** 7.5 → 9.0 · **Arquivo principal:** `src/index.css`

### Contexto
`src/index.css` possui **74 ocorrências** da palavra `gradient` — a maioria são gradientes inline repetidos como `from-blue-500/5 via-blue-400/5 to-background` que:
1. Não respeitam o tema dark/light automaticamente  
2. Aumentam reflow/repaint em Android mid-range  
3. Geram inconsistência visual entre componentes  

A arquitetura já usa `shouldReduceEffects` (via `useDeviceCapability`) nos componentes para desligar efeitos. O que falta é o mesmo nível de controle no CSS global.

### O que fazer

**Passo 1 — Criar tokens semânticos em `tailwind.config.ts`**  
Adicionar no bloco `theme.extend.backgroundImage`:

```ts
// tailwind.config.ts — dentro de theme.extend.backgroundImage
'card-subtle': 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/0.3) 100%)',
'hero-primary': 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, hsl(var(--primary)/0.03) 100%)',
'hero-success': 'linear-gradient(135deg, hsl(142 76% 36%/0.08) 0%, hsl(142 76% 36%/0.03) 100%)',
'surface-glass': 'linear-gradient(135deg, hsl(var(--background)/0.9) 0%, hsl(var(--muted)/0.4) 100%)',
```

**Passo 2 — Remover gradients do `index.css`**  
No `index.css`, as seguintes classes utilitárias inline devem ser removidas ou convertidas em `@apply` com os tokens acima:

- Todas as linhas com `background: linear-gradient(` dentro de `@layer base` e `@layer components`  
- Manter apenas os gradients que são parte do design system documentado (ex: `--gradient-primary` se existir como custom property)

**Passo 3 — Auditar componentes com gradients inline no className**  
Rodar no terminal:
```bash
grep -rn "from-blue-500.*via.*to-\|from-indigo-.*to-" src/components src/pages --include="*.tsx" | wc -l
```
Para cada resultado: se o componente já usa `shouldReduceEffects`, condicionar o gradiente a `!shouldReduceEffects`.

**Passo 4 — Regra CSS de fallback**  
No final de `src/index.css`, adicionar:
```css
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
```

### Critério de sucesso
```bash
grep -c "gradient" src/index.css
# Deve retornar ≤ 15
```

---

## PROMPT 2 — Segurança: Caregiver Rules no Firebase

**Camada:** Segurança · **Impacto:** 7.0 → 9.0  
**Arquivos:** `firestore.rules`, novo `src/services/shareDocumentService.ts`

### Contexto
`firestore.rules` tem **zero** regras de caregiver. O app tem telas de cuidador (`CaregiverAccept.tsx`, `useCaregiverVaccineReminders.ts`) mas o Firestore não tem nenhuma regra que permita a um cuidador ler dados de outro usuário de forma controlada. Qualquer acesso cross-user está sendo bloqueado pelo `isOwner()`, o que provavelmente quebra silenciosamente a funcionalidade de cuidador.

### O que fazer em `firestore.rules`

**Passo 1 — Adicionar helper `isCaregiverOf()` após a função `isAdmin()` (linha ~21):**

```javascript
// Verifica se o usuário autenticado é cuidador aprovado do userId alvo.
// O documento de vínculo fica em /users/{userId}/caregivers/{request.auth.uid}
// e deve ter o campo "status" == "approved" (escrito pela Cloud Function).
function isCaregiverOf(userId) {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(userId)/caregivers/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(userId)/caregivers/$(request.auth.uid)).data.status == "approved";
}
```

**Passo 2 — Adicionar subcoleção `caregivers` dentro de `match /users/{userId}`  (após linha ~124):**

```javascript
// Caregivers (subcollection) — managed exclusively by Cloud Functions
// Clients can read their own received-caregiver list; writes are server-only.
match /caregivers/{caregiverId} {
  // O dono vê quem são seus cuidadores
  allow read: if isOwner(userId);
  // O cuidador pode ler seu próprio vínculo (ex: checar status)
  allow read: if request.auth.uid == caregiverId;
  // Writes proibidos para cliente — somente Cloud Function via Admin SDK
}
```

**Passo 3 — Ampliar leitura de medications e doses para cuidadores aprovados:**

```javascript
// Medications (subcollection) — ATUALIZAR regra existente
match /medications/{medicationId} {
  allow read: if isOwner(userId) || isCaregiverOf(userId);
  allow write: if isOwner(userId);
}

// Doses (subcollection) — ATUALIZAR regra existente
match /doses/{doseId} {
  allow read: if isOwner(userId) || isCaregiverOf(userId);
  // Cuidadores podem marcar doses como tomadas
  allow update: if isCaregiverOf(userId) &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['taken', 'takenAt', 'updatedAt']);
  allow create, delete: if isOwner(userId);
}
```

**Passo 4 — Adicionar coleção `sharedDocuments` no nível raiz (após o bloco de `campaigns`):**

```javascript
// ===================================
// Shared Documents (link compartilhado com expiração)
// ===================================
match /sharedDocuments/{shareId} {
  // Leitura pública por link (documento tem expiresAt)
  allow read: if resource.data.expiresAt > request.time;
  // Apenas o dono do documento original pode criar o share
  allow create: if isAuthenticated() &&
    request.resource.data.ownerId == request.auth.uid &&
    request.resource.data.expiresAt is timestamp &&
    request.resource.data.expiresAt > request.time;
  // Apenas o dono pode revogar (deletar)
  allow delete: if isAuthenticated() &&
    resource.data.ownerId == request.auth.uid;
  // Updates proibidos — immutable após criação
}
```

**Passo 5 — Criar `src/services/shareDocumentService.ts`:**

```typescript
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
  /** URL-safe token usado como shareId (gerado pelo Firestore auto-id) */
  shareId?: string;
}

/**
 * Cria um link de compartilhamento temporário para um documento médico.
 * @param ownerId  - UID do usuário dono
 * @param documentId - ID do documento no Firestore
 * @param documentType - tipo do documento
 * @param expiresInHours - tempo até expirar (padrão: 72h)
 */
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

  return ref.id; // shareId
}

/**
 * Revoga (deleta) um link de compartilhamento antes do prazo.
 */
export async function revokeShareLink(shareId: string): Promise<void> {
  await deleteDoc(doc(db, "sharedDocuments", shareId));
}
```

### Critério de sucesso
```bash
grep -c "isCaregiverOf\|sharedDocuments" firestore.rules
# Deve retornar ≥ 6
```

---

## PROMPT 3 — Core Loop: Countdown ao vivo no HeroNextDose

**Camada:** Produto/Engajamento · **Impacto:** 7.0 → 8.5  
**Arquivo:** `src/components/HeroNextDose.tsx`

### Contexto
`HeroNextDose.tsx` tem 367 linhas. Usa `optimisticTaken` (✅) mas **não tem countdown**. O card mostra o horário da próxima dose estaticamente. Um contador regressivo é o elemento de maior impacto de engajamento em apps de saúde — cria urgência e feedback temporal sem qualquer complexidade de backend.

Verificado: nenhuma linha de `setInterval`, `useEffect` de timer, ou `timeLeft` existe no arquivo.

### O que fazer

**Passo 1 — Adicionar hook de countdown após as imports (linha ~13):**

```typescript
// src/components/HeroNextDose.tsx — adicionar após linha 12

import { memo, useCallback, useState, useEffect, useRef } from "react";

/** Retorna string "Xh Ym" ou "Xm Ys" até o targetDate. Retorna null se passou. */
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
```

**Passo 2 — Usar o hook dentro de `HeroNextDose` (após linha 133, onde `shouldReduceEffects` é declarado):**

```typescript
// Dentro da função HeroNextDose, após:
// const { shouldReduceEffects } = useDeviceCapability();

const doseDate = dose ? safeParseDoseDate(dose) : null;
const countdown = useCountdown(shouldReduceEffects ? null : doseDate);
```

**Passo 3 — Renderizar o countdown no card principal da próxima dose.**  
Localizar onde o horário da dose é exibido (buscar por `dose.scheduled_time` ou `format(doseDate, ...)`). Logo abaixo desse elemento, adicionar:

```tsx
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
```

> **Nota:** `aria-live="off"` é intencional — atualizar o contador a cada segundo com `aria-live="polite"` causaria flood de anúncios em leitores de tela.

**Passo 4 — Corrigir a última animação `height: "auto"` residual**  
Arquivo: `src/pages/internal/CampaignGenerator.tsx`, linha **742**:

```tsx
// ANTES:
<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">

// DEPOIS:
<motion.div
  initial={{ opacity: 0, scaleY: 0.95, transformOrigin: "top" }}
  animate={{ opacity: 1, scaleY: 1 }}
  exit={{ opacity: 0, scaleY: 0.95 }}
  transition={{ duration: 0.2 }}
  className="overflow-hidden"
>
```

### Critério de sucesso
```bash
grep -n "useCountdown\|countdown" src/components/HeroNextDose.tsx | wc -l
# Deve retornar ≥ 4

grep -c "animate={{ height" src/pages/internal/CampaignGenerator.tsx
# Deve retornar 0
```

---

## PROMPT 4 — Supabase Migration: Lotes 1, 2 e 3 (16 arquivos)

**Camada:** Arquitetura · **Impacto:** 6.5 → 8.0 (parcial)  
**Pré-requisito:** Firebase Firestore, Storage e Functions já configurados em `src/integrations/firebase/`

### Contexto
Auditoria confirma **34 arquivos** ainda importando `@supabase/supabase-js`. Dividir em 2 prompts (lotes 1-3 aqui, lotes 4-6 no Prompt 5) para evitar PRs gigantes.

### Padrão de migração a seguir

**Supabase → Firebase equivalência:**
```typescript
// SUPABASE                                  // FIREBASE
supabase.from('table').select('*')           →  getDocs(collection(db, 'table'))
supabase.from('table').insert({...})         →  addDoc(collection(db, 'table'), {...})
supabase.from('table').update({...}).eq(id)  →  updateDoc(doc(db, 'table', id), {...})
supabase.from('table').delete().eq(id)       →  deleteDoc(doc(db, 'table', id))
supabase.functions.invoke('fn', {body})      →  httpsCallable(functions, 'fn')(body)
supabase.storage.from('bucket').upload(...)  →  uploadBytes(ref(storage, path), file)
supabase.auth.getUser()                      →  auth.currentUser
```

### Lote 1 — Gamification (4 arquivos)

1. **`src/components/gamification/WeeklyLeaderboard.tsx`**  
   — Substituir query Supabase por `getDocs(query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(10)))`

2. **`src/components/gamification/DailyChallenges.tsx`** (se existir)  
   — Substituir por `getDocs(collection(db, 'challenges'))` filtrado por `where('date', '==', today)`

3. **`src/components/gamification/FamilyLeaderboard.tsx`** (se existir)  
   — Substituir por query na subcoleção `users/{uid}/familyProfiles` + merge de XP

4. **`src/components/gamification/WeeklyChallenges.tsx`** (se existir)  
   — Mesmo padrão do DailyChallenges com filtro de semana

### Lote 2 — Calendários (5 arquivos)

5. **`src/components/HealthCalendar.tsx`**  
6. **`src/components/ImprovedCalendar.tsx`**  
7. **`src/components/MiniWeekCalendar.tsx`**  
8. **`src/components/MonthlyProgressCalendar.tsx`**  
9. **`src/components/MonthlyReportCard.tsx`**  

Todos leem doses/medications por período. Padrão:
```typescript
const q = query(
  collection(db, `users/${uid}/doses`),
  where('scheduledDate', '>=', startOfMonth),
  where('scheduledDate', '<=', endOfMonth)
);
const snap = await getDocs(q);
const doses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```

### Lote 3 — Notificações (6 arquivos)

10. **`src/components/NotificationDiagnostics.tsx`**  
11. **`src/components/NotificationMetrics.tsx`**  
12. **`src/components/NotificationPermissionPrompt.tsx`**  
13. **`src/components/NotificationSettingsReminder.tsx`**  
14. **`src/components/VaccineNotificationSettings.tsx`**  
15. **`src/pages/Notifications.tsx`**  

Todos leem/escrevem em `users/{uid}/notificationMetrics` ou `users/{uid}/pushSubscriptions`.  
Atenção especial: se algum chama `supabase.functions.invoke`, substituir por:
```typescript
import { getFunctions, httpsCallable } from "firebase/functions";
const functions = getFunctions();
const sendNotification = httpsCallable(functions, 'sendNotification');
await sendNotification({ userId: uid, ...payload });
```

### Critério de sucesso parcial
```bash
grep -rl "supabase" src/components/gamification src/components/HealthCalendar.tsx \
  src/components/ImprovedCalendar.tsx src/components/MiniWeekCalendar.tsx \
  src/components/MonthlyProgressCalendar.tsx src/components/MonthlyReportCard.tsx \
  src/components/NotificationDiagnostics.tsx src/components/NotificationMetrics.tsx \
  src/components/NotificationPermissionPrompt.tsx src/components/NotificationSettingsReminder.tsx \
  src/components/VaccineNotificationSettings.tsx src/pages/Notifications.tsx 2>/dev/null | wc -l
# Deve retornar 0
```

---

## PROMPT 5 — Supabase Migration: Lotes 4, 5 e 6 + Remoção total (18 arquivos)

**Camada:** Arquitetura · **Impacto:** 8.0 → 9.5  
**Pré-requisito:** Prompt 4 completo e validado

### Lote 4 — Onboarding (4 arquivos)

1. **`src/components/onboarding/OnboardingStepNotifications.tsx`**  
2. **`src/components/onboarding/SmartOnboarding.tsx`**  
3. **`src/components/OnboardingScreens.tsx`**  
4. **`src/components/OnboardingTour.tsx`**  

Padrão: onboarding geralmente salva flags de conclusão. Substituir por:
```typescript
// Salvar passo concluído
await updateDoc(doc(db, 'users', uid), {
  'onboarding.stepsCompleted': arrayUnion(stepName),
  'onboarding.completedAt': stepName === 'final' ? serverTimestamp() : null,
});
```

### Lote 5 — Hooks (7 arquivos)

5. **`src/hooks/useAchievements.ts`** — ler de `users/{uid}/achievements`  
6. **`src/hooks/useAndroidAlarm.ts`** — chamar Cloud Function via `httpsCallable`  
7. **`src/hooks/useCaregiverVaccineReminders.ts`** — ler de `users/{uid}/vaccinations` com `isCaregiverOf` (após Prompt 2)  
8. **`src/hooks/useSmartMedicationSuggestions.ts`** — chamar Gemini via Cloud Function  
9. **`src/hooks/useVaccinationRecords.ts`** — ler/escrever `users/{uid}/vaccinations`  
10. **`src/hooks/useVaccineReminders.ts`** — ler `users/{uid}/vaccinations` + criar reminders  
11. **`src/hooks/useWeightInsights.ts`** — ler `users/{uid}/weightHistory`  

### Lote 6 — Componentes mistos (7 arquivos)

12. **`src/components/DocumentOCR.tsx`** — **ATENÇÃO:** usa `supabase.functions.invoke` para OCR. Substituir por:
    ```typescript
    const extractText = httpsCallable(functions, 'extractDocumentText');
    const result = await extractText({ imageBase64, mimeType });
    ```
13. **`src/components/FeatureSpotlight.tsx`**  
14. **`src/components/GuidedTour.tsx`**  
15. **`src/components/PaymentMethodModal.tsx`** — Stripe direto, Supabase apenas para salvar método. Migrar para Cloud Function `updatePaymentMethod`.  
16. **`src/components/PrescriptionBulkAddWizard.tsx`**  
17. **`src/components/SmartInsightsCard.tsx`**  
18. **`src/components/profile/ProfileStatsGrid.tsx`** — ler stats agregadas de `users/{uid}` documento raiz  

### Remoção final

Após validar que todos os 34 arquivos estão migrados:

```bash
# 1. Confirmar que não há mais imports
grep -rl "supabase" src/ --include="*.ts" --include="*.tsx"
# Deve retornar apenas src/integrations/supabase/client.ts

# 2. Remover o diretório de integração
rm -rf src/integrations/supabase/

# 3. Remover dependência
npm uninstall @supabase/supabase-js

# 4. Confirmar bundle menor
npm run build -- --report
```

### Critério de sucesso
```bash
grep -rl "supabase" src/ --include="*.ts" --include="*.tsx" | wc -l
# Deve retornar 0
```

---

## Resumo: O que cada prompt entrega

| Prompt | Camada | Nota atual → após |
|--------|--------|-------------------|
| 1 — Gradients CSS | UI/UX | 7.5 → 9.0 |
| 2 — Caregiver Rules | Segurança | 7.0 → 9.0 |
| 3 — Countdown + última animação | Core Loop | 7.0 → 8.5 |
| 4 — Supabase lotes 1-3 | Arquitetura | 6.5 → 8.0 |
| 5 — Supabase lotes 4-6 + remoção | Arquitetura | 8.0 → 9.5 |

### Nota projetada após todos os prompts: **9.2 / 10**

O que impede o 10.0 absoluto:
- Paywall contextual não auditado (gatilho de conversão em momento de fricção)
- Trial temporizado não implementado
- Testes E2E de fluxo crítico (tomar dose → streak) ausentes
- Métricas de conversão free → premium não instrumentadas

Esses 4 itens são estratégicos (produto/negócio) e não técnicos — o app chega na nota 9 com esses 5 prompts.
