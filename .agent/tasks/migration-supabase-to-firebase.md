# 🔥 Migração Supabase → Firebase - HoraMed

**Status**: 🟡 Planejamento  
**Prioridade**: Alta  
**Complexidade**: 9/10  
**Tempo Estimado**: 3-5 dias  

---

## 📋 Contexto

### Situação Atual
- ✅ **Supabase gerenciado pelo Lovable Cloud** (sem acesso direto ao DB)
- ✅ **Dados em produção** com usuários ativos
- ✅ **58 migrations** documentadas
- ✅ **Schema complexo**: Auth, DB relacional (PostgreSQL), Storage, Edge Functions

### Motivação da Migração
1. **Controle total**: Supabase gerenciado pelo Lovable limita modificações diretas
2. **Flexibilidade**: Firebase oferece mais controle sobre infraestrutura
3. **Integração**: Melhor integração com Google Cloud Platform

### Restrições
- ❌ **Zero downtime não é possível** (migração de dados complexa)
- ✅ **Rollback disponível** (manter Supabase ativo em paralelo)
- ✅ **Novo repositório** (`antigravity-firebase`) para não interferir com Lovable

---

## 🎯 Objetivos

1. ✅ **Migrar 100% dos dados** sem perda
2. ✅ **Manter funcionalidades** idênticas
3. ✅ **Minimizar downtime** (máximo 2 horas)
4. ✅ **Rollback seguro** se necessário

---

## 📊 Análise do Schema Atual

### Tabelas Principais (58 migrations analisadas)

#### **1. Autenticação & Usuários**
- `profiles` - Perfis de usuários
- `user_profiles` - Perfis adicionais (família)
- `subscriptions` - Assinaturas Stripe

#### **2. Medicamentos & Lembretes**
- `items` - Medicamentos cadastrados
- `doses` - Doses agendadas
- `medication_interactions` - Interações medicamentosas
- `user_interaction_alerts` - Alertas de interação

#### **3. Saúde & Documentos**
- `medical_documents` - Documentos médicos (Storage)
- `medical_reports` - Relatórios de exames
- `weight_history` - Histórico de peso
- `vaccination_records` - Carteira de vacinação

#### **4. Gamificação & Engajamento**
- `xp_transactions` - Sistema de XP
- `achievements` - Conquistas
- `streak_protection` - Proteção de sequência

#### **5. Referral System**
- `referrals` - Indicações
- `referral_rewards` - Recompensas
- `referral_goals` - Metas de indicação
- `referral_fraud_logs` - Anti-fraude
- `referral_discounts` - Descontos acumulados

#### **6. Features Avançadas**
- `feature_flags` - Flags de features
- `notification_metrics` - Métricas de notificações
- `push_subscriptions` - Assinaturas push

### **Funções PostgreSQL (Edge Functions)**
- `validate_referral_signup()` - Validação de indicação
- `complete_referral_onboarding()` - Onboarding de indicados
- `process_referral_subscription()` - Processar assinatura
- `check_and_grant_referral_goals()` - Verificar metas
- `get_user_referral_discount()` - Calcular desconto

### **Storage Buckets**
- `medical-documents` - Documentos médicos (PDFs, imagens)
- `profile-avatars` - Fotos de perfil

---

## 🔄 Estratégia de Migração: Blue-Green Deployment

### Fase 1: Preparação (Dia 1)
**Objetivo**: Setup Firebase + Exportação de dados

#### 1.1 Setup Firebase Project
```bash
# Criar projeto Firebase
npm install -g firebase-tools
firebase login
firebase init

# Serviços a ativar:
# - Authentication (Email/Password + Google)
# - Firestore Database
# - Cloud Storage
# - Cloud Functions
# - Hosting (PWA)
```

#### 1.2 Criar Scripts de Exportação
**Arquivo**: `scripts/export-supabase-data.ts`

```typescript
// Exportar dados via Supabase API (já que não temos acesso direto ao DB)
// Ordem de exportação (respeitar foreign keys):
// 1. profiles
// 2. user_profiles
// 3. subscriptions
// 4. items
// 5. doses
// 6. medical_documents (metadata)
// 7. medical_reports
// 8. ... (demais tabelas)
```

#### 1.3 Análise de Dependências
- Mapear todas as foreign keys
- Identificar triggers e functions que precisam ser reescritas
- Documentar RLS policies para replicar no Firestore Rules

---

### Fase 2: Modelagem Firestore (Dia 1-2)
**Objetivo**: Adaptar schema relacional para NoSQL

#### 2.1 Decisões de Modelagem

**PostgreSQL (Relacional)** → **Firestore (NoSQL)**

##### Estratégia 1: Denormalização Controlada
```typescript
// ANTES (Supabase - Relacional)
profiles (user_id, name, email)
user_profiles (id, user_id, name, relationship)
items (id, user_id, profile_id, medication_name)

// DEPOIS (Firebase - Denormalizado)
users/{userId} {
  profile: { name, email, ... },
  familyProfiles: [
    { id, name, relationship }
  ],
  medications: [
    { id, name, dosage, ... }
  ]
}
```

**Prós**: Menos reads, mais rápido  
**Contras**: Duplicação de dados, updates complexos

##### Estratégia 2: Subcoleções (Recomendado)
```typescript
// Firebase - Subcoleções
users/{userId}
  ├── profile (doc)
  ├── familyProfiles/{profileId}
  ├── medications/{medicationId}
  ├── doses/{doseId}
  ├── documents/{documentId}
  └── xpTransactions/{transactionId}
```

**Prós**: Organização clara, queries eficientes  
**Contras**: Mais reads em alguns casos

#### 2.2 Mapeamento de Tabelas

| Supabase Table | Firebase Collection | Estratégia |
|----------------|---------------------|------------|
| `profiles` | `users/{userId}` | Doc raiz |
| `user_profiles` | `users/{userId}/familyProfiles` | Subcoleção |
| `items` | `users/{userId}/medications` | Subcoleção |
| `doses` | `users/{userId}/doses` | Subcoleção |
| `medical_documents` | `users/{userId}/documents` | Subcoleção |
| `medical_reports` | `users/{userId}/reports` | Subcoleção |
| `medication_interactions` | `medicationInteractions/{id}` | Coleção global |
| `referrals` | `users/{userId}/referrals` | Subcoleção |
| `xp_transactions` | `users/{userId}/xpTransactions` | Subcoleção |

#### 2.3 Índices Compostos
```typescript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "doses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "scheduledFor", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    // ... outros índices
  ]
}
```

---

### Fase 3: Migração de Autenticação (Dia 2)
**Objetivo**: Migrar usuários do Supabase Auth → Firebase Auth

#### 3.1 Exportar Usuários
```typescript
// Script: scripts/migrate-auth.ts
import { createClient } from '@supabase/supabase-js'
import { getAuth } from 'firebase-admin/auth'

async function migrateUsers() {
  // 1. Listar todos os usuários do Supabase (via API)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email, full_name, avatar_url')
  
  // 2. Criar usuários no Firebase Auth
  for (const profile of profiles) {
    await getAuth().createUser({
      uid: profile.user_id, // Manter mesmo UID
      email: profile.email,
      displayName: profile.full_name,
      photoURL: profile.avatar_url,
      emailVerified: true,
      // Senha será resetada via email
    })
  }
  
  // 3. Enviar email de reset de senha para todos
}
```

#### 3.2 Estratégia de Senhas
**Problema**: Supabase não expõe hashes de senha via API

**Solução**:
1. Criar usuários no Firebase Auth com **senha temporária**
2. Enviar **email de reset de senha** para todos os usuários
3. Usuários definem nova senha no primeiro login

**Comunicação**:
```
Assunto: Atualização do HoraMed - Ação Necessária

Olá [Nome],

Estamos migrando para uma nova infraestrutura mais rápida e segura!

Por segurança, você precisará redefinir sua senha:
1. Acesse: [link de reset]
2. Crie uma nova senha
3. Faça login normalmente

Seus dados estão seguros e não serão perdidos.

Equipe HoraMed
```

---

### Fase 4: Migração de Dados (Dia 2-3)
**Objetivo**: Transferir todos os dados do Supabase → Firestore

#### 4.1 Script de Migração
```typescript
// scripts/migrate-data.ts

import { createClient } from '@supabase/supabase-js'
import { getFirestore } from 'firebase-admin/firestore'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const db = getFirestore()

async function migrateData() {
  console.log('🚀 Iniciando migração de dados...')
  
  // ORDEM IMPORTANTE (respeitar foreign keys)
  await migrateProfiles()
  await migrateUserProfiles()
  await migrateSubscriptions()
  await migrateMedications()
  await migrateDoses()
  await migrateDocuments()
  await migrateReports()
  await migrateXPTransactions()
  await migrateReferrals()
  await migrateMedicationInteractions()
  
  console.log('✅ Migração concluída!')
}

async function migrateProfiles() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
  
  const batch = db.batch()
  
  for (const profile of profiles) {
    const userRef = db.collection('users').doc(profile.user_id)
    batch.set(userRef, {
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      referralCode: profile.referral_code,
      cpf: profile.cpf,
      cpfVerified: profile.cpf_verified,
      deviceFingerprint: profile.device_fingerprint,
      onboardingCompletedAt: profile.onboarding_completed_at,
      emailVerified: profile.email_verified,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    })
  }
  
  await batch.commit()
  console.log(`✅ Migrados ${profiles.length} perfis`)
}

// ... funções similares para outras tabelas
```

#### 4.2 Validação de Dados
```typescript
// Após migração, validar integridade
async function validateMigration() {
  // 1. Contar registros
  const supabaseCount = await supabase.from('profiles').select('count')
  const firebaseCount = await db.collection('users').count().get()
  
  if (supabaseCount !== firebaseCount) {
    throw new Error('❌ Contagem de registros não bate!')
  }
  
  // 2. Validar amostra aleatória
  // 3. Verificar foreign keys
  // 4. Testar queries críticas
}
```

---

### Fase 5: Migração de Storage (Dia 3)
**Objetivo**: Transferir arquivos do Supabase Storage → Firebase Storage

#### 5.1 Script de Migração de Arquivos
```typescript
// scripts/migrate-storage.ts

async function migrateStorage() {
  // 1. Listar todos os arquivos no Supabase Storage
  const { data: files } = await supabase.storage
    .from('medical-documents')
    .list()
  
  // 2. Download + Upload para Firebase Storage
  for (const file of files) {
    // Download do Supabase
    const { data: blob } = await supabase.storage
      .from('medical-documents')
      .download(file.name)
    
    // Upload para Firebase
    const bucket = getStorage().bucket()
    await bucket.file(`medical-documents/${file.name}`).save(blob)
  }
  
  console.log(`✅ Migrados ${files.length} arquivos`)
}
```

---

### Fase 6: Reescrever Edge Functions (Dia 3-4)
**Objetivo**: Converter Supabase Edge Functions → Firebase Cloud Functions

#### 6.1 Mapeamento de Functions

| Supabase Function | Firebase Function | Tipo |
|-------------------|-------------------|------|
| `validate_referral_signup()` | `validateReferralSignup` | Callable |
| `complete_referral_onboarding()` | `completeReferralOnboarding` | Callable |
| `process_referral_subscription()` | `processReferralSubscription` | Callable |
| `check_and_grant_referral_goals()` | `checkAndGrantReferralGoals` | Background |

#### 6.2 Exemplo de Conversão
```typescript
// ANTES (Supabase Edge Function - SQL)
CREATE OR REPLACE FUNCTION validate_referral_signup(...)
RETURNS JSONB AS $$
BEGIN
  -- SQL logic
END;
$$ LANGUAGE plpgsql;

// DEPOIS (Firebase Cloud Function - TypeScript)
export const validateReferralSignup = functions.https.onCall(
  async (data, context) => {
    const { referredUserId, referralCode, deviceFingerprint, ipAddress } = data
    
    // 1. Buscar referrer
    const referrerSnap = await db
      .collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get()
    
    if (referrerSnap.empty) {
      return { success: false, error: 'Código inválido' }
    }
    
    // 2. Check anti-fraude
    const fraudDetected = await checkDeviceDuplicate(deviceFingerprint)
    
    if (fraudDetected) {
      return { success: false, fraud_detected: true }
    }
    
    // 3. Criar referral
    const referralRef = await db.collection('referrals').add({
      referrerUserId: referrerSnap.docs[0].id,
      referredUserId,
      referralCodeUsed: referralCode,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    })
    
    return { success: true, referralId: referralRef.id }
  }
)
```

---

### Fase 7: Atualizar Frontend (Dia 4)
**Objetivo**: Substituir Supabase Client → Firebase SDK

#### 7.1 Criar Branch Separado
```bash
git checkout -b antigravity-firebase
```

#### 7.2 Instalar Firebase SDK
```bash
npm install firebase
npm uninstall @supabase/supabase-js
```

#### 7.3 Substituir Cliente
```typescript
// ANTES (src/integrations/supabase/client.ts)
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, key)

// DEPOIS (src/integrations/firebase/client.ts)
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

#### 7.4 Atualizar Hooks (Exemplo)
```typescript
// ANTES (useUserProfiles.ts)
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)

// DEPOIS
const profilesSnap = await getDocs(
  collection(db, `users/${userId}/familyProfiles`)
)
const data = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

---

### Fase 8: Firestore Security Rules (Dia 4)
**Objetivo**: Replicar RLS Policies do Supabase

#### 8.1 Converter Policies
```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
      
      // Family profiles
      match /familyProfiles/{profileId} {
        allow read, write: if isOwner(userId);
      }
      
      // Medications
      match /medications/{medicationId} {
        allow read, write: if isOwner(userId);
      }
      
      // Doses
      match /doses/{doseId} {
        allow read, write: if isOwner(userId);
      }
      
      // Documents
      match /documents/{documentId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Global medication interactions (read-only)
    match /medicationInteractions/{interactionId} {
      allow read: if isAuthenticated();
      allow write: if false; // Admin only
    }
  }
}
```

---

### Fase 9: Testes (Dia 4-5)
**Objetivo**: Validar todas as funcionalidades

#### 9.1 Checklist de Testes

- [ ] **Autenticação**
  - [ ] Login com email/senha
  - [ ] Cadastro de novo usuário
  - [ ] Reset de senha
  - [ ] Google Sign-In
  
- [ ] **Medicamentos**
  - [ ] Criar medicamento
  - [ ] Editar medicamento
  - [ ] Deletar medicamento
  - [ ] Listar medicamentos
  
- [ ] **Doses**
  - [ ] Agendar dose
  - [ ] Marcar como tomada
  - [ ] Pular dose
  - [ ] Notificações push
  
- [ ] **Documentos**
  - [ ] Upload de documento
  - [ ] Download de documento
  - [ ] Deletar documento
  
- [ ] **Referral System**
  - [ ] Gerar código de indicação
  - [ ] Validar indicação
  - [ ] Conceder recompensas
  - [ ] Calcular descontos
  
- [ ] **Gamificação**
  - [ ] Ganhar XP
  - [ ] Desbloquear conquistas
  - [ ] Streak protection

#### 9.2 Testes de Performance
```typescript
// Comparar performance Supabase vs Firebase
const start = performance.now()
// Query
const end = performance.now()
console.log(`Query time: ${end - start}ms`)
```

---

### Fase 10: Deploy & Cutover (Dia 5)
**Objetivo**: Colocar Firebase em produção

#### 10.1 Preparação
1. ✅ Todos os testes passando
2. ✅ Dados validados
3. ✅ Backup completo do Supabase
4. ✅ Comunicação aos usuários

#### 10.2 Cutover (Janela de Manutenção - 2h)
```bash
# 1. Colocar app em modo manutenção
# 2. Exportação final de dados (delta)
npm run migrate:final-sync

# 3. Deploy Firebase
firebase deploy --only firestore:rules,functions,hosting

# 4. Atualizar DNS/CDN para novo app
# 5. Monitorar logs e métricas

# 6. Se tudo OK: remover modo manutenção
# 7. Se problemas: rollback para Supabase
```

#### 10.3 Monitoramento Pós-Deploy
- Firebase Console → Logs
- Sentry → Error tracking
- Google Analytics → User behavior
- Lighthouse → Performance

---

## 🔙 Plano de Rollback

### Cenário: Problemas Críticos no Firebase

1. **Reverter DNS** para app Supabase (5 min)
2. **Comunicar usuários** sobre instabilidade temporária
3. **Analisar logs** do Firebase para identificar problema
4. **Corrigir** e tentar novamente em 24-48h

### Manter Supabase Ativo
- Não deletar projeto Supabase por **30 dias**
- Manter backup dos dados
- Monitorar custos de ambos os serviços

---

## 💰 Estimativa de Custos

### Firebase (Estimativa Mensal)
- **Firestore**: ~$25/mês (50k reads/day)
- **Cloud Functions**: ~$10/mês (10k invocations/day)
- **Storage**: ~$5/mês (10GB)
- **Hosting**: Grátis (Spark plan)
- **Auth**: Grátis (até 50k MAU)

**Total**: ~$40/mês

### Supabase (Atual)
- **Pro Plan**: $25/mês
- **Storage**: Incluído
- **Auth**: Incluído

**Diferença**: +$15/mês (Firebase mais caro, mas com mais controle)

---

## 📝 Checklist de Execução

### Pré-Migração
- [ ] Criar projeto Firebase
- [ ] Configurar billing
- [ ] Criar branch `antigravity-firebase`
- [ ] Comunicar usuários sobre manutenção programada

### Migração
- [ ] Exportar dados do Supabase
- [ ] Migrar autenticação
- [ ] Migrar dados (Firestore)
- [ ] Migrar arquivos (Storage)
- [ ] Reescrever Cloud Functions
- [ ] Atualizar frontend
- [ ] Configurar Security Rules
- [ ] Testes completos

### Pós-Migração
- [ ] Deploy em produção
- [ ] Monitorar logs (24h)
- [ ] Validar métricas de uso
- [ ] Coletar feedback dos usuários
- [ ] Desativar Supabase (após 30 dias)

---

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de dados | Baixa | Crítico | Backup completo + validação |
| Downtime prolongado | Média | Alto | Testes extensivos + rollback |
| Bugs no Firebase | Média | Médio | Testes A/B + monitoramento |
| Custos inesperados | Baixa | Médio | Alertas de billing |
| Usuários não resetarem senha | Alta | Baixo | Email + notificação in-app |

---

## 📞 Próximos Passos

**Aguardando aprovação do usuário para:**

1. ✅ Criar projeto Firebase
2. ✅ Iniciar Fase 1 (Preparação)
3. ✅ Definir data da janela de manutenção

**Perguntas Pendentes:**

1. Qual o melhor dia/horário para a janela de manutenção? (menor impacto nos usuários)
2. Você tem acesso ao Google Cloud Platform ou preciso criar conta?
3. Quer que eu crie um repositório separado ou apenas uma branch?

---

**Criado por**: Backend Specialist Agent  
**Data**: 2026-01-28  
**Versão**: 1.0
