# 🔗 Análise de Interconectividade - HoraMed

> **Gerado em:** 2026-01-30  
> **Versão do App:** 2.0  
> **Status:** Migração Supabase → Firebase em andamento

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Mapa de Rotas e Navegação](#mapa-de-rotas-e-navegação)
3. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
4. [Contextos Globais](#contextos-globais)
5. [Hooks Customizados](#hooks-customizados)
6. [Componentes e Dependências](#componentes-e-dependências)
7. [Integrações Externas](#integrações-externas)
8. [Fluxos de Dados Críticos](#fluxos-de-dados-críticos)
9. [Dependências entre Funcionalidades](#dependências-entre-funcionalidades)
10. [Mapa de Correlações](#mapa-de-correlações)

---

## 🏗️ Visão Geral da Arquitetura

### Stack Tecnológico

```
Frontend:
├── React 18.3.1 (SPA)
├── TypeScript 5.8.3
├── Vite 5.4.19 (Build Tool)
├── React Router DOM 7.6.1 (Navegação)
├── TailwindCSS 3.4.17 (Estilização)
├── Radix UI (Componentes)
├── Framer Motion 12.23.24 (Animações)
└── Tanstack Query 5.83.0 (Cache/Estado)

Backend/Infraestrutura:
├── Firebase 12.8.0
│   ├── Authentication (Auth)
│   ├── Firestore (Database)
│   ├── Cloud Functions (Serverless)
│   ├── Cloud Storage (Arquivos)
│   └── Cloud Messaging (Push)
├── Stripe (Pagamentos)
└── Google Gemini AI (Assistente de Saúde)

Mobile:
├── Capacitor 7.4.4 (Wrapper Nativo)
├── Android SDK (Plataforma)
└── PWA (Progressive Web App)
```

### Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│         CAMADA DE APRESENTAÇÃO          │
│  (Pages, Components, UI)                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CAMADA DE LÓGICA                │
│  (Hooks, Contexts, AI Handlers)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CAMADA DE INTEGRAÇÃO            │
│  (Firebase, Stripe, Gemini)             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CAMADA DE DADOS                 │
│  (Firestore, Storage, Cache)            │
└─────────────────────────────────────────┘
```

---

## 🗺️ Mapa de Rotas e Navegação

### Estrutura de Rotas (71 rotas mapeadas)

#### 🏠 Rotas Principais (HoraMed 2.0)

| Rota | Componente | Descrição | Autenticação |
|------|-----------|-----------|--------------|
| `/` | `Index` | Landing/Redirect | Não |
| `/hoje` | `TodayRedesign` | Dashboard Principal | ✅ |
| `/rotina` | `MedicamentosHub` | Hub de Medicamentos | ✅ |
| `/progresso` | `Progress` | Análise de Adesão | ✅ |
| `/conquistas` | `Achievements` | Sistema de Conquistas | ✅ |
| `/jornada` | `Gamification` | Gamificação/XP | ✅ |
| `/carteira` | `Cofre` | Documentos Médicos | ✅ |
| `/perfil` | `Profile` | Perfil do Usuário | ✅ |

#### 💊 Rotas de Medicamentos

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/medicamentos` | `MedicamentosHub` | Hub unificado (3 tabs) | `useMedications`, `useWeeklyDoses` |
| `/adicionar` | `AddItemRedirect` | Adicionar medicamento | `useMedications`, `useItemLimits` |
| `/edit/:id` | `EditItemRedirect` | Editar medicamento | `useMedications` |
| `/estoque/:itemId` | `StockDetails` | Detalhes de estoque | `useStockProjection` |
| `/historico-medicamentos` | `MedicationHistory` | Histórico de doses | `useWeeklyDoses` |
| `/interacoes` | `DrugInteractions` | Interações medicamentosas | `useMedicationInteractions` |

#### 📄 Rotas do Cofre (Documentos)

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/carteira` | `Cofre` | Lista de documentos | `useCofre` |
| `/carteira/upload` | `CofreUpload` | Upload de documentos | `useCofre`, `useDocumentLimits` |
| `/carteira/criar-manual` | `CofreManualCreate` | Criação manual | `useCofre` |
| `/carteira/:id/review` | `CofreDocumentReview` | Revisão OCR | `useCofre`, AI OCR |
| `/carteira/:id/editar` | `CofreDocumentoEdit` | Editar documento | `useCofre` |
| `/carteira/:id` | `CofreDocumento` | Visualizar documento | `useCofre` |
| `/compartilhar/:token` | `CompartilharDocumento` | Compartilhamento público | Sem auth |

#### 🏥 Rotas de Saúde

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/consultas` | `MedicalAppointments` | Consultas médicas | Firestore `appointments` |
| `/carteira-vacina` | `CarteiraVacina` | Carteira de vacinação | `useVaccinationRecords` |
| `/exames` | `MedicalReports` | Exames/Relatórios | `useCofre` |
| `/sinais-vitais` | `SinaisVitais` | Sinais vitais | Firestore `vitalSigns` |
| `/peso/historico` | `WeightHistory` | Histórico de peso | `useWeightInsights` |
| `/diario-efeitos` | `SideEffectsDiary` | Diário de efeitos | `useSideEffectsLog` |

#### 👤 Rotas de Perfil

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/perfil` | `Profile` | Perfil principal | `useUserProfiles`, `useProfileCache` |
| `/perfil/criar` | `ProfileCreate` | Criar perfil familiar | `useUserProfiles` |
| `/perfil/editar/:id` | `ProfileEdit` | Editar perfil | `useUserProfiles` |
| `/assinatura` | `SubscriptionManagement` | Gerenciar assinatura | `useSubscription`, Stripe |
| `/recompensas` | `Recompensas` | Sistema de recompensas | `useReferralSystem`, `useXPSystem` |
| `/indique-ganhe` | `IndiqueGanhe` | Programa de indicação | `useReferralSystem` |

#### ⚙️ Rotas de Configuração

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/notificacoes-config` | `NotificationSettings` | Config. notificações | `usePushNotifications` |
| `/alarmes` | `AlarmSettings` | Config. alarmes | `useAlarms`, `useAndroidAlarm` |
| `/alarmes/diagnostico` | `AlarmDiagnostics` | Diagnóstico de alarmes | `useAlarms` |
| `/exportar-dados` | `DataExport` | Exportar dados | Firestore export |

#### 🔐 Rotas de Autenticação

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/auth` | `Auth` | Login/Signup | Firebase Auth |
| `/onboarding` | `SimpleOnboarding` | Onboarding simples | - |
| `/onboarding-completo` | `OnboardingFlow` | Onboarding completo | - |
| `/bem-vindo` | `Welcome` | Tela de boas-vindas | - |

#### 💳 Rotas de Pagamento

| Rota | Componente | Função | Dependências |
|------|-----------|--------|--------------|
| `/planos` | `Plans` | Planos de assinatura | Stripe Prices |
| `/assinatura/sucesso` | `SubscriptionSuccess` | Sucesso no pagamento | Stripe Session |
| `/assinatura/cancelado` | `SubscriptionCanceled` | Pagamento cancelado | - |

#### 📱 Rotas Públicas (Sem Auth)

| Rota | Componente | Função |
|------|-----------|--------|
| `/privacidade` | `Privacy` | Política de privacidade |
| `/termos` | `Terms` | Termos de uso |
| `/sobre` | `About` | Sobre o app |
| `/compartilhar/:token` | `CompartilharDocumento` | Documento compartilhado |
| `/cuidador/aceitar/:token` | `CaregiverAccept` | Aceitar convite de cuidador |
| `/consulta/:token` | `ConsultationCardView` | Cartão de consulta |

### Navegação Principal (Bottom Navigation)

```tsx
Navigation.tsx
├── /hoje (Home)
├── /rotina (Medicamentos)
├── /progresso (Progresso)
├── /carteira (Cofre)
└── /perfil (Perfil)
```

### Floating Actions (Sempre visíveis)

```tsx
FloatingActions
├── HealthAIButton (Clara - Assistente AI)
└── FloatingAddButton (Adicionar medicamento rápido)
```

---

## 🗄️ Estrutura de Banco de Dados

### Firestore Collections (Hierarquia)

```
firestore/
├── users/{userId}                          # Documento do usuário
│   ├── email: string
│   ├── displayName: string
│   ├── photoURL: string
│   ├── isPremium: boolean
│   ├── onboardingCompleted: boolean
│   ├── stripeCustomerId: string
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
│   │
│   ├── familyProfiles/{profileId}          # Perfis familiares
│   │   ├── name: string
│   │   ├── relationship: string
│   │   ├── birthDate: Timestamp
│   │   └── avatarUrl: string
│   │
│   ├── medications/{medicationId}          # Medicamentos
│   │   ├── name: string
│   │   ├── dosage: string
│   │   ├── frequency: string
│   │   ├── schedules: array
│   │   ├── startDate: Timestamp
│   │   ├── endDate: Timestamp
│   │   ├── isActive: boolean
│   │   └── profileId: string (FK)
│   │
│   ├── schedules/{scheduleId}              # Horários (NOVO)
│   │   ├── medicationId: string (FK)
│   │   ├── time: string (HH:mm)
│   │   ├── days: array
│   │   └── isActive: boolean
│   │
│   ├── stock/{stockId}                     # Estoque
│   │   ├── medicationId: string (FK)
│   │   ├── quantity: number
│   │   ├── unit: string
│   │   ├── expirationDate: Timestamp
│   │   └── lowStockThreshold: number
│   │
│   ├── doses/{doseId}                      # Doses geradas
│   │   ├── medicationId: string (FK)
│   │   ├── scheduleId: string (FK)
│   │   ├── scheduledTime: Timestamp
│   │   ├── status: 'pending'|'taken'|'skipped'|'late'
│   │   ├── takenAt: Timestamp
│   │   ├── notificationSent: boolean
│   │   └── profileId: string (FK)
│   │
│   ├── documents/{documentId}              # Documentos médicos (Cofre)
│   │   ├── type: 'prescription'|'exam'|'vaccine'|'report'
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── fileUrl: string (Storage)
│   │   ├── thumbnailUrl: string
│   │   ├── ocrData: object
│   │   ├── status: 'pending'|'reviewed'|'approved'
│   │   ├── expiresAt: Timestamp
│   │   └── profileId: string (FK)
│   │
│   ├── reports/{reportId}                  # Relatórios médicos
│   │   ├── type: string
│   │   ├── date: Timestamp
│   │   ├── results: object
│   │   └── fileUrl: string
│   │
│   ├── vaccinations/{vaccinationId}        # Vacinações
│   │   ├── vaccineName: string
│   │   ├── date: Timestamp
│   │   ├── nextDose: Timestamp
│   │   ├── lot: string
│   │   └── profileId: string (FK)
│   │
│   ├── weightHistory/{entryId}             # Histórico de peso
│   │   ├── weight: number
│   │   ├── date: Timestamp
│   │   ├── notes: string
│   │   └── profileId: string (FK)
│   │
│   ├── xpTransactions/{transactionId}      # Transações de XP
│   │   ├── amount: number
│   │   ├── reason: string
│   │   ├── type: 'earn'|'spend'
│   │   └── createdAt: Timestamp
│   │
│   ├── achievements/{achievementId}        # Conquistas
│   │   ├── achievementType: string
│   │   ├── unlockedAt: Timestamp
│   │   └── progress: number
│   │
│   ├── referrals/{referralId}              # Indicações
│   │   ├── referredUserId: string
│   │   ├── status: 'pending'|'completed'
│   │   ├── rewardClaimed: boolean
│   │   └── createdAt: Timestamp
│   │
│   ├── subscription/{subscriptionId}       # Assinatura
│   │   ├── planType: 'free'|'premium'
│   │   ├── status: 'active'|'inactive'|'canceled'
│   │   ├── stripeSubscriptionId: string
│   │   ├── startedAt: Timestamp
│   │   └── expiresAt: Timestamp
│   │
│   ├── pushSubscriptions/{subscriptionId}  # Push Notifications
│   │   ├── endpoint: string
│   │   ├── keys: object
│   │   └── createdAt: Timestamp
│   │
│   └── notificationMetrics/{metricId}      # Métricas de notificações
│       ├── sent: number
│       ├── delivered: number
│       ├── clicked: number
│       └── date: Timestamp
│
├── medicationInteractions/{interactionId}  # Interações (Global)
│   ├── medication1: string
│   ├── medication2: string
│   ├── severity: 'low'|'medium'|'high'
│   └── description: string
│
├── featureFlags/{flagId}                   # Feature Flags (Global)
│   ├── name: string
│   ├── enabled: boolean
│   └── rolloutPercentage: number
│
└── referralFraudLogs/{logId}               # Logs de fraude (Admin)
    ├── userId: string
    ├── reason: string
    └── timestamp: Timestamp
```

### Firestore Security Rules (Resumo)

```javascript
// Regras principais
- users/{userId}: Apenas o próprio usuário pode ler/escrever
- users/{userId}/*: Subcoleções herdam permissão do pai
- medicationInteractions: Leitura pública, escrita apenas admin
- featureFlags: Leitura pública, escrita apenas admin
- referralFraudLogs: Apenas admin
```

### Firebase Storage (Estrutura)

```
storage/
├── users/{userId}/
│   ├── documents/                  # Documentos do Cofre
│   │   ├── {documentId}.pdf
│   │   ├── {documentId}.jpg
│   │   └── thumbnails/
│   │       └── {documentId}_thumb.jpg
│   │
│   ├── profile/                    # Fotos de perfil
│   │   └── avatar.jpg
│   │
│   └── exports/                    # Exportações de dados
│       └── {timestamp}_export.json
```

### Índices Firestore (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "doses",
      "fields": [
        { "fieldPath": "scheduledTime", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "medications",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🌐 Contextos Globais

### 1. AuthContext

**Arquivo:** `src/contexts/AuthContext.tsx`

**Responsabilidades:**
- Gerenciar estado de autenticação do Firebase
- Fornecer `user`, `loading`, `signIn`, `signOut`, `signUp`
- Persistir sessão

**Consumidores:**
- Todos os componentes protegidos
- `ProtectedRoute`
- Hooks que precisam de `userId`

**Dependências:**
- Firebase Auth
- `onAuthStateChanged` listener

### 2. SubscriptionContext

**Arquivo:** `src/contexts/SubscriptionContext.tsx`

**Responsabilidades:**
- Gerenciar estado de assinatura (free/premium)
- Sincronizar com Firestore `users/{userId}/subscription/current`
- Fornecer `isPremium`, `planType`, `status`

**Consumidores:**
- Componentes que verificam limites premium
- `useItemLimits`, `useDocumentLimits`, `useAILimits`
- Páginas de paywall

**Dependências:**
- AuthContext (userId)
- Firestore real-time listener

### 3. ProfileCacheContext

**Arquivo:** `src/contexts/ProfileCacheContext.tsx`

**Responsabilidades:**
- Cache de perfis familiares
- Reduzir leituras do Firestore
- Fornecer `profiles`, `activeProfile`, `setActiveProfile`

**Consumidores:**
- Todos os componentes que exibem dados de perfis
- Hooks de medicamentos, doses, documentos

**Dependências:**
- AuthContext (userId)
- Firestore `users/{userId}/familyProfiles`

### 4. LanguageContext

**Arquivo:** `src/contexts/LanguageContext.tsx`

**Responsabilidades:**
- Gerenciar idioma da aplicação (pt-BR, en-US)
- Fornecer traduções

**Consumidores:**
- Componentes de UI
- Mensagens de erro/sucesso

**Dependências:**
- LocalStorage para persistência

---

## 🪝 Hooks Customizados (63 hooks mapeados)

### Hooks de Medicamentos

| Hook | Função | Dependências Firestore | Retorno |
|------|--------|------------------------|---------|
| `useMedications` | CRUD de medicamentos | `users/{userId}/medications` | `medications`, `addMedication`, `updateMedication`, `deleteMedication` |
| `useMedicationInfo` | Buscar info de medicamento brasileiro | `medicamentos-brasileiros.ts` (local) | `searchMedication`, `getMedicationDetails` |
| `useMedicationInteractions` | Verificar interações | `medicationInteractions` (global) | `checkInteractions`, `interactions` |
| `useMedicationLimits` | Limites de medicamentos (free/premium) | `SubscriptionContext` | `canAddMedication`, `limit`, `count` |
| `useMedicationAlarm` | Alarmes de medicamentos | `useAlarms`, `useAndroidAlarm` | `scheduleAlarm`, `cancelAlarm` |

### Hooks de Doses

| Hook | Função | Dependências Firestore | Retorno |
|------|--------|------------------------|---------|
| `useDoseGeneration` | Gerar doses automaticamente | `users/{userId}/doses` | Auto-executa |
| `useWeeklyDoses` | Doses da semana | `users/{userId}/doses` | `doses`, `updateDoseStatus` |
| `useOverdueDoses` | Doses atrasadas | `users/{userId}/doses` | `overdueDoses`, `count` |

### Hooks de Cofre (Documentos)

| Hook | Função | Dependências Firestore | Retorno |
|------|--------|------------------------|---------|
| `useCofre` | CRUD de documentos | `users/{userId}/documents` | `documents`, `uploadDocument`, `deleteDocument` |
| `useDocumentLimits` | Limites de documentos | `SubscriptionContext` | `canUpload`, `limit`, `count` |
| `usePrescriptionControl` | Controle de prescrições | `users/{userId}/documents` (type=prescription) | `prescriptions`, `expiredCount` |

### Hooks de Gamificação

| Hook | Função | Dependências Firestore | Retorno |
|------|--------|------------------------|---------|
| `useXPSystem` | Sistema de XP | `users/{userId}/xpTransactions` | `xp`, `level`, `addXP` |
| `useAchievements` | Conquistas | `users/{userId}/achievements` | `achievements`, `unlockAchievement` |
| `useStreakCalculator` | Calcular sequências | `users/{userId}/doses` | `currentStreak`, `longestStreak` |
| `useStreakProtection` | Proteção de sequências | `useXPSystem` | `hasProtection`, `useProtection` |

### Hooks de Notificações

| Hook | Função | Dependências | Retorno |
|------|--------|--------------|---------|
| `usePushNotifications` | Push notifications | Firebase Messaging, Capacitor | `requestPermission`, `token` |
| `useAlarms` | Alarmes locais | Capacitor Local Notifications | `scheduleAlarm`, `cancelAlarm` |
| `useAndroidAlarm` | Alarmes Android nativos | Android AlarmManager | `scheduleExactAlarm`, `cancelAlarm` |
| `useResilientReminders` | Lembretes resilientes | `useAlarms`, `usePushNotifications` | `scheduleReminder` |

### Hooks de Perfil

| Hook | Função | Dependências Firestore | Retorno |
|------|--------|------------------------|---------|
| `useUserProfiles` | Perfis familiares | `users/{userId}/familyProfiles` | `profiles`, `addProfile`, `updateProfile` |
| `useProfileCache` | Cache de perfis | `ProfileCacheContext` | `profiles`, `activeProfile` |

### Hooks de Assinatura

| Hook | Função | Dependências | Retorno |
|------|--------|--------------|---------|
| `useSubscription` | Estado de assinatura | `SubscriptionContext` | `isPremium`, `planType` |

### Hooks de AI

| Hook | Função | Dependências | Retorno |
|------|--------|--------------|---------|
| `useHealthAgent` | Assistente de saúde AI | Firebase Functions `healthAssistant` | `sendMessage`, `messages` |
| `useAILimits` | Limites de AI | `SubscriptionContext` | `canUseAI`, `limit`, `count` |
| `useVoiceInputAI` | Entrada de voz com AI | `useHealthAgent`, Web Speech API | `startListening`, `transcript` |

### Hooks de Utilidades

| Hook | Função | Dependências | Retorno |
|------|--------|--------------|---------|
| `useOptimizedQuery` | Query otimizada | Tanstack Query | `data`, `loading` |
| `useDebouncedValue` | Debounce de valores | - | `debouncedValue` |
| `useIntersectionObserver` | Observador de interseção | - | `isIntersecting`, `ref` |
| `useHapticFeedback` | Feedback háptico | Capacitor Haptics | `impact`, `notification` |

### Hooks de Métricas

| Hook | Função | Dependências Firestore | Retorno |
|------|--------|------------------------|---------|
| `useAppMetrics` | Métricas do app | `users/{userId}/metrics` | `trackEvent` |
| `useNotificationMetrics` | Métricas de notificações | `users/{userId}/notificationMetrics` | `trackNotification` |

---

## 🧩 Componentes e Dependências

### Componentes Críticos (Sempre carregados)

| Componente | Função | Dependências |
|-----------|--------|--------------|
| `Navigation` | Navegação inferior | React Router |
| `ProtectedRoute` | Proteção de rotas | `AuthContext` |
| `HealthAIButton` | Botão da Clara (AI) | `useHealthAgent` |
| `FloatingAddButton` | Adicionar medicamento rápido | `useMedications` |
| `SplashScreen` | Tela de splash | - |

### Componentes Lazy-Loaded (129 componentes)

Todos os componentes de páginas são carregados sob demanda via `React.lazy()` para otimizar o bundle inicial.

### Componentes Compartilhados (UI)

**Localização:** `src/components/ui/`

- `Button`, `Input`, `Select`, `Dialog`, `Toast`, `Card`, `Avatar`, `Badge`, etc.
- Baseados em Radix UI + TailwindCSS

### Componentes de Negócio

**Localização:** `src/components/`

| Componente | Função | Dependências |
|-----------|--------|--------------|
| `DoseCard` | Card de dose | `useWeeklyDoses` |
| `MedicationCard` | Card de medicamento | `useMedications` |
| `HealthCalendar` | Calendário de saúde | `useWeeklyDoses` |
| `AdherenceChart` | Gráfico de adesão | `useStreakCalculator` |
| `DocumentOCR` | OCR de documentos | Firebase Vision API |
| `ClaraProactiveCard` | Sugestões da Clara | `useHealthAgent` |

---

## 🔌 Integrações Externas

### 1. Firebase

**Serviços utilizados:**

| Serviço | Função | Configuração |
|---------|--------|--------------|
| **Authentication** | Login/Signup | Email/Password, Google OAuth |
| **Firestore** | Banco de dados | Real-time listeners |
| **Cloud Functions** | Backend serverless | Node.js 20 |
| **Cloud Storage** | Armazenamento de arquivos | Regras de segurança |
| **Cloud Messaging** | Push notifications | FCM |
| **Hosting** | Deploy do frontend | `app.horamed.net` |

**Arquivo de configuração:** `src/integrations/firebase/client.ts`

### 2. Stripe

**Função:** Processamento de pagamentos

**Integrações:**

| Função | Endpoint | Descrição |
|--------|----------|-----------|
| Criar Checkout | `createCheckoutSession` (Cloud Function) | Inicia sessão de pagamento |
| Portal do Cliente | `createCustomerPortal` (Cloud Function) | Gerenciar assinatura |
| Webhook | `stripeWebhook` (Cloud Function) | Receber eventos do Stripe |

**Produtos configurados:**

```javascript
PRICES = {
  BRL: {
    monthly: 'price_1SvI3uHh4P8HSV4YQvyCQGtN',  // R$ 19,90/mês
    annual: 'price_1StuprHh4P8HSV4YRO4eI5YE',   // R$ 199,90/ano
  },
  USD: {
    monthly: 'price_1SvI4XHh4P8HSV4YGE6v1szt',  // US$ 3,99/mês
    annual: 'price_1SuWdlHh4P8HSV4YsApnqZxY',   // US$ 39,99/ano
  }
}
```

**Fluxo de pagamento:**

```
Frontend (Plans.tsx)
    ↓ createCheckoutSession()
Cloud Function
    ↓ Stripe.checkout.sessions.create()
Stripe Checkout
    ↓ Pagamento
Stripe Webhook
    ↓ checkout.session.completed
Cloud Function (stripeWebhook)
    ↓ updateUserSubscription()
Firestore (users/{userId}/subscription/current)
    ↓ Real-time listener
Frontend (SubscriptionContext)
    ↓ isPremium = true
```

### 3. Google Gemini AI

**Função:** Assistente de saúde (Clara)

**Integração:**

| Função | Endpoint | Descrição |
|--------|----------|-----------|
| Chat | `healthAssistant` (Cloud Function) | Conversa com Clara |

**Modelo:** `gemini-pro`

**Fluxo:**

```
Frontend (HealthAIButton)
    ↓ sendMessage()
useHealthAgent
    ↓ httpsCallable('healthAssistant')
Cloud Function
    ↓ GoogleGenerativeAI.getGenerativeModel()
Gemini API
    ↓ Resposta
Frontend (AIChatUI)
```

### 4. Capacitor (Mobile)

**Plugins utilizados:**

| Plugin | Função |
|--------|--------|
| `@capacitor/app` | Lifecycle do app |
| `@capacitor/local-notifications` | Notificações locais |
| `@capacitor/push-notifications` | Push notifications |
| `@aparajita/capacitor-biometric-auth` | Autenticação biométrica |

### 5. PWA (Progressive Web App)

**Configuração:** `vite-plugin-pwa`

**Recursos:**
- Service Worker
- Manifest (`manifest.webmanifest`)
- Instalação no dispositivo
- Offline support (cache de assets)

---

## 🔄 Fluxos de Dados Críticos

### Fluxo 1: Adicionar Medicamento

```
1. Usuário clica em "+" (FloatingAddButton)
   ↓
2. Navega para /adicionar (AddItemRedirect)
   ↓
3. Preenche formulário (AddMedicationWizard)
   ↓
4. useMedications.addMedication()
   ↓
5. Firestore: users/{userId}/medications (create)
   ↓
6. Firestore: users/{userId}/schedules (create múltiplos)
   ↓
7. useDoseGeneration (auto-trigger)
   ↓
8. Firestore: users/{userId}/doses (create múltiplos)
   ↓
9. useAlarms.scheduleAlarm() (para cada dose)
   ↓
10. Capacitor Local Notifications (agendamento)
    ↓
11. Navegação de volta para /rotina
    ↓
12. MedicamentosHub atualiza (real-time listener)
```

### Fluxo 2: Tomar Dose

```
1. Usuário vê DoseCard em /hoje
   ↓
2. Clica em "Tomar" (DoseActionButton)
   ↓
3. useWeeklyDoses.updateDoseStatus(doseId, 'taken')
   ↓
4. Firestore: users/{userId}/doses/{doseId} (update)
   ↓
5. useXPSystem.addXP(10, 'dose_taken')
   ↓
6. Firestore: users/{userId}/xpTransactions (create)
   ↓
7. Firestore: users/{userId} (update xp, level)
   ↓
8. useStreakCalculator recalcula (auto)
   ↓
9. useAchievements verifica conquistas (auto)
   ↓
10. Se conquista desbloqueada:
    ↓ Firestore: users/{userId}/achievements (create)
    ↓ Toast de celebração
    ↓
11. DoseCard atualiza (real-time listener)
```

### Fluxo 3: Upload de Documento (Cofre)

```
1. Usuário navega para /carteira/upload
   ↓
2. Seleciona arquivo (CofreUpload)
   ↓
3. useDocumentLimits.canUpload() (verifica limite)
   ↓
4. Se premium ou dentro do limite:
   ↓
5. useCofre.uploadDocument(file, metadata)
   ↓
6. Firebase Storage: users/{userId}/documents/{id}.pdf (upload)
   ↓
7. Firestore: users/{userId}/documents (create com fileUrl)
   ↓
8. Se tipo = 'prescription':
   ↓ Firebase Vision API (OCR)
   ↓ Extrai dados (medicamentos, dosagens, datas)
   ↓ Firestore: users/{userId}/documents/{id} (update ocrData)
   ↓
9. Navega para /carteira/:id/review (CofreDocumentReview)
   ↓
10. Usuário revisa dados OCR
    ↓
11. Confirma ou edita
    ↓
12. useCofre.updateDocument(id, { status: 'reviewed' })
    ↓
13. Firestore: users/{userId}/documents/{id} (update)
    ↓
14. Navegação de volta para /carteira
    ↓
15. Cofre atualiza (real-time listener)
```

### Fluxo 4: Assinatura Premium

```
1. Usuário navega para /planos
   ↓
2. Seleciona plano (Plans.tsx)
   ↓
3. Clica em "Assinar" (PlanCard)
   ↓
4. httpsCallable('createCheckoutSession')({ planType, countryCode })
   ↓
5. Cloud Function cria Stripe Checkout Session
   ↓
6. Retorna { url: 'https://checkout.stripe.com/...' }
   ↓
7. Redireciona para Stripe Checkout
   ↓
8. Usuário completa pagamento
   ↓
9. Stripe envia webhook: checkout.session.completed
   ↓
10. Cloud Function (stripeWebhook) recebe evento
    ↓
11. updateUserSubscription(uid, subId, custId, 'active', 'premium')
    ↓
12. Firestore: users/{userId}/subscription/current (update)
    ↓
13. Firestore: users/{userId} (update isPremium = true)
    ↓
14. Stripe redireciona para /assinatura/sucesso
    ↓
15. SubscriptionContext atualiza (real-time listener)
    ↓
16. Frontend reflete status premium (limites aumentados)
```

### Fluxo 5: Conversa com Clara (AI)

```
1. Usuário clica em HealthAIButton
   ↓
2. Abre AIChatUI (modal)
   ↓
3. Digita mensagem
   ↓
4. useHealthAgent.sendMessage(message)
   ↓
5. useAILimits.canUseAI() (verifica limite)
   ↓
6. Se permitido:
   ↓
7. httpsCallable('healthAssistant')({ messages })
   ↓
8. Cloud Function processa com Gemini AI
   ↓
9. Retorna { role: 'assistant', content: '...' }
   ↓
10. useAILimits.incrementUsage()
    ↓
11. Firestore: users/{userId}/aiUsage (update)
    ↓
12. AIChatUI exibe resposta
```

---

## 🔗 Dependências entre Funcionalidades

### Mapa de Dependências

```
Medicamentos
├── Doses (geradas automaticamente)
│   ├── Alarmes (agendados para cada dose)
│   ├── XP (ganho ao tomar dose)
│   └── Sequências (calculadas a partir de doses)
├── Estoque (vinculado a medicamentos)
│   └── Alertas de estoque baixo
└── Interações (verificadas entre medicamentos)

Cofre (Documentos)
├── Prescrições
│   ├── OCR (extração de dados)
│   └── Medicamentos (podem ser criados a partir de prescrições)
├── Exames
├── Vacinas
│   └── Lembretes de próximas doses
└── Relatórios

Gamificação
├── XP
│   ├── Doses tomadas (+10 XP)
│   ├── Sequências mantidas (+50 XP)
│   ├── Documentos adicionados (+20 XP)
│   └── Conquistas desbloqueadas (+100 XP)
├── Conquistas
│   ├── Baseadas em doses, sequências, documentos
│   └── Desbloqueiam recompensas
└── Sequências
    ├── Calculadas a partir de doses
    └── Proteção de sequência (item premium)

Assinatura
├── Limites
│   ├── Medicamentos (Free: 3, Premium: ∞)
│   ├── Documentos (Free: 5, Premium: ∞)
│   └── AI (Free: 10/dia, Premium: ∞)
├── Recursos Premium
│   ├── Proteção de sequência
│   ├── Relatórios avançados
│   └── Exportação de dados
└── Stripe (processamento)

Notificações
├── Push Notifications (via Firebase)
├── Alarmes Locais (via Capacitor)
├── Alarmes Android Nativos (via AlarmManager)
└── Lembretes Resilientes (fallback)

Perfis Familiares
├── Medicamentos (vinculados a perfis)
├── Doses (vinculadas a perfis)
├── Documentos (vinculados a perfis)
└── Vacinas (vinculadas a perfis)

AI (Clara)
├── Assistente de Saúde
├── Sugestões Proativas
├── OCR de Documentos
└── Análise de Interações
```

### Dependências Críticas (Não podem ser removidas)

| Funcionalidade | Depende de | Motivo |
|---------------|-----------|--------|
| Doses | Medicamentos | Doses são geradas a partir de medicamentos |
| Alarmes | Doses | Alarmes são agendados para doses |
| XP | Doses | XP é ganho ao tomar doses |
| Sequências | Doses | Sequências são calculadas a partir de doses |
| Estoque | Medicamentos | Estoque é vinculado a medicamentos |
| Prescrições | Cofre | Prescrições são documentos do cofre |
| Limites | Assinatura | Limites dependem do plano |
| Perfis | Usuário | Perfis são subcoleções do usuário |

### Dependências Opcionais (Podem ser desativadas)

| Funcionalidade | Depende de | Pode ser desativada? |
|---------------|-----------|---------------------|
| Gamificação | Doses | ✅ Sim (via Feature Flag) |
| AI (Clara) | - | ✅ Sim (via Feature Flag) |
| Referral | Assinatura | ✅ Sim (via Feature Flag) |
| Vacinas | Cofre | ✅ Sim (funcionalidade independente) |
| Peso | - | ✅ Sim (funcionalidade independente) |

---

## 📊 Mapa de Correlações

### Correlação: Medicamentos ↔ Doses

```sql
-- Relação: 1 Medicamento → N Doses
-- Chave: medicationId

Medication {
  id: "med_123"
  name: "Paracetamol"
  schedules: ["08:00", "20:00"]
}

Doses {
  { id: "dose_1", medicationId: "med_123", scheduledTime: "2026-01-30 08:00" }
  { id: "dose_2", medicationId: "med_123", scheduledTime: "2026-01-30 20:00" }
  { id: "dose_3", medicationId: "med_123", scheduledTime: "2026-01-31 08:00" }
}
```

### Correlação: Medicamentos ↔ Estoque

```sql
-- Relação: 1 Medicamento → 1 Estoque
-- Chave: medicationId

Medication {
  id: "med_123"
  name: "Paracetamol"
}

Stock {
  id: "stock_1"
  medicationId: "med_123"
  quantity: 30
  unit: "comprimidos"
}
```

### Correlação: Usuário ↔ Perfis ↔ Medicamentos

```sql
-- Relação: 1 Usuário → N Perfis → N Medicamentos
-- Chave: profileId

User {
  id: "user_123"
}

FamilyProfiles {
  { id: "profile_1", name: "João" }
  { id: "profile_2", name: "Maria" }
}

Medications {
  { id: "med_1", profileId: "profile_1", name: "Paracetamol" }
  { id: "med_2", profileId: "profile_2", name: "Ibuprofeno" }
}
```

### Correlação: Doses ↔ XP ↔ Conquistas

```sql
-- Relação: Dose tomada → XP ganho → Conquista desbloqueada

Dose {
  id: "dose_1"
  status: "taken"
  takenAt: "2026-01-30 08:05"
}
    ↓ Trigger
XPTransaction {
  id: "xp_1"
  amount: 10
  reason: "dose_taken"
  createdAt: "2026-01-30 08:05"
}
    ↓ Acumula
User {
  xp: 100 → 110
  level: 1 → 2 (se atingir threshold)
}
    ↓ Verifica
Achievement {
  id: "ach_1"
  achievementType: "first_dose"
  unlockedAt: "2026-01-30 08:05"
}
```

### Correlação: Documentos ↔ Medicamentos (via OCR)

```sql
-- Relação: Documento (Prescrição) → OCR → Medicamentos criados

Document {
  id: "doc_1"
  type: "prescription"
  ocrData: {
    medications: [
      { name: "Paracetamol", dosage: "500mg", frequency: "8/8h" }
    ]
  }
}
    ↓ Usuário confirma
Medication {
  id: "med_1"
  name: "Paracetamol"
  dosage: "500mg"
  frequency: "8/8h"
  sourceDocumentId: "doc_1"
}
```

### Correlação: Assinatura ↔ Limites

```sql
-- Relação: Plano → Limites aplicados

Subscription {
  planType: "free"
  status: "active"
}
    ↓ Define
Limits {
  medications: 3
  documents: 5
  aiQueries: 10/day
}

Subscription {
  planType: "premium"
  status: "active"
}
    ↓ Define
Limits {
  medications: ∞
  documents: ∞
  aiQueries: ∞
}
```

---

## 🎯 Pontos de Integração Críticos

### 1. Geração Automática de Doses

**Trigger:** Criação/Atualização de Medicamento

**Componente:** `useDoseGeneration`

**Lógica:**
```typescript
// Para cada medicamento ativo:
// 1. Buscar schedules
// 2. Gerar doses para os próximos 7 dias
// 3. Evitar duplicatas (verificar se já existe)
// 4. Agendar alarmes para cada dose
```

**Dependências:**
- `users/{userId}/medications`
- `users/{userId}/schedules`
- `users/{userId}/doses`
- `useAlarms`

### 2. Sincronização de Assinatura

**Trigger:** Webhook do Stripe

**Componente:** Cloud Function `stripeWebhook`

**Lógica:**
```typescript
// Eventos tratados:
// - checkout.session.completed
// - customer.subscription.updated
// - customer.subscription.deleted

// Atualiza:
// - users/{userId}/subscription/current
// - users/{userId}.isPremium
```

**Dependências:**
- Stripe Webhook Secret
- Firestore

### 3. Sistema de XP

**Trigger:** Ações do usuário (dose tomada, documento adicionado, etc.)

**Componente:** `useXPSystem`

**Lógica:**
```typescript
// Ações que geram XP:
// - Dose tomada: +10 XP
// - Sequência de 7 dias: +50 XP
// - Documento adicionado: +20 XP
// - Conquista desbloqueada: +100 XP

// Cálculo de nível:
// level = Math.floor(xp / 100) + 1
```

**Dependências:**
- `users/{userId}/xpTransactions`
- `users/{userId}` (xp, level)

### 4. Verificação de Interações

**Trigger:** Adição de medicamento

**Componente:** `useMedicationInteractions`

**Lógica:**
```typescript
// 1. Buscar todos os medicamentos ativos do usuário
// 2. Para cada par de medicamentos:
//    - Verificar em medicationInteractions (global)
//    - Se encontrar interação, retornar alerta
```

**Dependências:**
- `users/{userId}/medications`
- `medicationInteractions` (global)

---

## 🚨 Pontos de Atenção

### 1. Migração Supabase → Firebase

**Status:** Em andamento

**Componentes ainda com Supabase:**
- Alguns hooks legados
- Scripts de migração

**Ação:** Verificar e remover dependências de `@supabase/supabase-js`

### 2. Limites de Firestore

**Leituras/Escritas:**
- Free tier: 50k leituras/dia, 20k escritas/dia
- Blaze (Pay-as-you-go): $0.06 por 100k leituras

**Otimizações implementadas:**
- Real-time listeners (evita polling)
- Cache via Tanstack Query (5 min stale time)
- ProfileCacheContext (reduz leituras de perfis)

### 3. Alarmes Android

**Problema:** Android 12+ requer permissão especial para alarmes exatos

**Solução:** `useAndroidAlarm` solicita permissão via `SCHEDULE_EXACT_ALARM`

**Fallback:** Se permissão negada, usa alarmes inexatos

### 4. Limites de AI (Gemini)

**Free tier:** 60 requisições/minuto

**Controle:** `useAILimits` limita uso para usuários free (10 consultas/dia)

### 5. Storage de Documentos

**Limite:** 5GB no plano Free do Firebase

**Otimizações:**
- Compressão de imagens
- Thumbnails (reduzidos)
- Limpeza de documentos antigos (soft delete)

---

## 📈 Métricas e Monitoramento

### Eventos Rastreados (useAppMetrics)

| Evento | Quando | Dados |
|--------|--------|-------|
| `app_opened` | App inicia | timestamp |
| `medication_added` | Medicamento criado | medicationId |
| `dose_taken` | Dose tomada | doseId, onTime |
| `document_uploaded` | Documento enviado | documentId, type |
| `achievement_unlocked` | Conquista desbloqueada | achievementId |
| `subscription_started` | Assinatura iniciada | planType |

### Métricas de Notificações

| Métrica | Descrição |
|---------|-----------|
| `sent` | Notificações enviadas |
| `delivered` | Notificações entregues |
| `clicked` | Notificações clicadas |
| `dismissed` | Notificações descartadas |

---

## 🔐 Segurança

### Firestore Rules

- **Princípio:** Usuário só acessa seus próprios dados
- **Exceções:** 
  - `medicationInteractions` (leitura pública)
  - `featureFlags` (leitura pública)
  - Documentos compartilhados (via token)

### Storage Rules

- **Princípio:** Usuário só acessa seus próprios arquivos
- **Path:** `users/{userId}/*`

### Cloud Functions

- **Autenticação:** Todas as funções verificam `context.auth`
- **Validação:** Inputs são validados antes de processar

### Stripe

- **Webhook Secret:** Valida assinatura de webhooks
- **Customer ID:** Vinculado ao Firebase UID

---

## 📝 Conclusão

O app HoraMed possui uma arquitetura bem estruturada com:

- **71 rotas** mapeadas
- **63 hooks customizados**
- **129 componentes** (lazy-loaded)
- **4 contextos globais**
- **15+ subcoleções** no Firestore
- **3 integrações externas** principais (Firebase, Stripe, Gemini)

### Principais Correlações:

1. **Medicamentos → Doses → Alarmes → XP → Conquistas**
2. **Documentos → OCR → Medicamentos**
3. **Assinatura → Limites → Funcionalidades Premium**
4. **Perfis → Medicamentos/Doses/Documentos**

### Dependências Críticas:

- Firebase (Auth, Firestore, Functions, Storage, Messaging)
- Stripe (Pagamentos)
- Gemini AI (Assistente)
- Capacitor (Mobile)

### Próximos Passos:

1. ✅ Concluir migração Supabase → Firebase
2. ✅ Otimizar queries Firestore (índices)
3. ✅ Implementar cache agressivo
4. ⏳ Adicionar testes E2E
5. ⏳ Monitoramento de performance (Firebase Performance)

---

**Documento gerado automaticamente por Antigravity AI**  
**Data:** 2026-01-30  
**Versão:** 1.0
