# 🔄 Guia de Migração: Supabase → Firebase

## 📋 Mapeamento de APIs

### Autenticação

| Supabase | Firebase |
|----------|----------|
| `supabase.auth.getUser()` | `getCurrentUser()` ou `useAuth()` |
| `supabase.auth.signInWithPassword()` | `signIn(email, password)` |
| `supabase.auth.signUp()` | `signUp(email, password)` |
| `supabase.auth.signOut()` | `signOut()` |
| `supabase.auth.onAuthStateChange()` | `useAuth()` hook |

### Firestore (Database)

| Supabase | Firebase |
|----------|----------|
| `supabase.from('table').select()` | `fetchCollection('collection')` |
| `supabase.from('table').select().eq('id', value)` | `fetchCollection('collection', [where('id', '==', value)])` |
| `supabase.from('table').insert()` | `setDocument('collection', id, data)` |
| `supabase.from('table').update()` | `updateDocument('collection', id, data)` |
| `supabase.from('table').delete()` | `deleteDocument('collection', id)` |
| `supabase.from('table').select().single()` | `fetchDocument('collection', id)` |

### Real-time Subscriptions

| Supabase | Firebase |
|----------|----------|
| `supabase.from('table').on('*', callback).subscribe()` | `useCollection('collection')` |
| `supabase.from('table').on('INSERT', callback)` | `useCollection('collection')` (auto-updates) |
| `supabase.from('table').on('UPDATE', callback)` | `useCollection('collection')` (auto-updates) |

### Storage

| Supabase | Firebase |
|----------|----------|
| `supabase.storage.from('bucket').upload()` | `uploadBytes(ref(storage, path), file)` |
| `supabase.storage.from('bucket').download()` | `getDownloadURL(ref(storage, path))` |
| `supabase.storage.from('bucket').remove()` | `deleteObject(ref(storage, path))` |

---

## 🔧 Exemplos de Migração

### Exemplo 1: Fetch com filtro

**Antes (Supabase)**:
```typescript
const { data, error } = await supabase
  .from('medications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

**Depois (Firebase)**:
```typescript
import { fetchCollection, where, orderBy } from '@/integrations/firebase'

const { data, error } = await fetchCollection('medications', [
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
])
```

### Exemplo 2: Real-time subscription

**Antes (Supabase)**:
```typescript
const subscription = supabase
  .from('doses')
  .on('*', (payload) => {
    console.log('Change:', payload)
  })
  .subscribe()
```

**Depois (Firebase)**:
```typescript
import { useCollection } from '@/integrations/firebase'

const { data: doses, loading } = useCollection('doses')
// Auto-updates quando há mudanças!
```

### Exemplo 3: Insert/Update

**Antes (Supabase)**:
```typescript
const { data, error } = await supabase
  .from('medications')
  .insert({ name: 'Aspirina', dosage: '100mg' })
```

**Depois (Firebase)**:
```typescript
import { setDocument } from '@/integrations/firebase'

const { error } = await setDocument('medications', 'med-id', {
  name: 'Aspirina',
  dosage: '100mg'
})
```

---

## 📝 Mudanças de Nomenclatura

### Campos de Data

| Supabase | Firebase |
|----------|----------|
| `created_at` | `createdAt` (camelCase) |
| `updated_at` | `updatedAt` (camelCase) |
| `deleted_at` | `deletedAt` (camelCase) |

### IDs

| Supabase | Firebase |
|----------|----------|
| `user_id` | `userId` (camelCase) |
| `profile_id` | `profileId` (camelCase) |
| `medication_id` | `medicationId` (camelCase) |

### Estrutura de Dados

**Supabase** (Tabelas relacionais):
```
medications (table)
├── id
├── user_id (foreign key)
├── name
└── dosage
```

**Firebase** (Subcoleções):
```
users/{userId}/
└── medications/{medicationId}
    ├── name
    └── dosage
```

---

## 🎯 Arquivos a Migrar (21 arquivos)

### Prioridade ALTA (Autenticação e Core)
- [ ] `src/contexts/SubscriptionContext.tsx`
- [ ] `src/hooks/useSmartRedirect.ts`
- [ ] `src/hooks/useProfileCache.ts`

### Prioridade MÉDIA (Features Principais)
- [ ] `src/hooks/useDoseGeneration.ts`
- [ ] `src/hooks/useAlarms.ts`
- [ ] `src/hooks/useMedicationInteractions.ts`
- [ ] `src/hooks/useSideEffectsLog.ts`
- [ ] `src/hooks/useConsultationCard.ts`
- [ ] `src/hooks/useCaregivers.ts`

### Prioridade BAIXA (Features Secundárias)
- [ ] `src/hooks/useHealthAgent.ts`
- [ ] `src/hooks/useReferralSystem.ts`
- [ ] `src/hooks/usePushSubscription.ts`
- [ ] `src/hooks/useTravelMode.ts`
- [ ] `src/hooks/useVoiceInputAI.ts`
- [ ] `src/hooks/useAdaptiveSuggestions.ts`
- [ ] `src/pages/HealthAnalysis.tsx`
- [ ] `src/pages/DocumentScan.tsx`
- [ ] `src/pages/DataExport.tsx`
- [ ] `src/lib/medicalReportPdf.ts`
- [ ] `src/components/HealthInsights.tsx`
- [ ] `src/components/QuickDoseWidget.tsx`

---

## ⚠️ Atenção Especial

### 1. Subcoleções de Usuário

No Firebase, dados de usuário devem estar em subcoleções:

```typescript
// ❌ ERRADO
await fetchCollection('medications', [where('userId', '==', userId)])

// ✅ CORRETO
await fetchCollection(`users/${userId}/medications`)
```

### 2. Timestamps

Firestore usa `Timestamp` ao invés de strings ISO:

```typescript
import { timestampToDate } from '@/integrations/firebase'

const date = timestampToDate(doc.createdAt) // Timestamp → Date
```

### 3. Real-time vs One-time

- Use `useCollection()` para dados que mudam frequentemente
- Use `fetchCollection()` para dados estáticos

---

## 🚀 Próximos Passos

1. Migrar `SubscriptionContext.tsx` (autenticação)
2. Migrar hooks de medicamentos
3. Migrar hooks de doses
4. Testar cada hook migrado
5. Remover dependência do Supabase

---

**Vou começar pela migração dos arquivos de ALTA prioridade!**
