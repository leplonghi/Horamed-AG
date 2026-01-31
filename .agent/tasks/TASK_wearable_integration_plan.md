# Planejamento de Integração: Wearables & Lifestyle (Horamed)

## 1. Visão Geral
Este módulo permite que o Horamed consuma dados de "Estilo de Vida" (Passos, Sono, Calorias, Frequência Cardíaca de Repouso) de dispositivos populares.

Como o Horamed é uma aplicação Web (PWA), a integração segue o modelo **Cloud-to-Cloud**. Não conectamos o Bluetooth do navegador ao relógio. Conectamos o Backend do Horamed à Nuvem do fabricante (Google, Fitbit, Garmin, etc.).

## 2. Estrutura de Arquitetura

### A. Fluxo de Conexão (OAuth 2.0)
1.  **Interface**: Usuário acessa "Dispositivos & Apps" no Perfil.
2.  **Ação**: Clica em "Conectar Google Fit" (exemplo).
3.  **Autorização**: Redireciona para página de login do Google.
4.  **Token**: Horamed recebe um `access_token` e `refresh_token`.
5.  **Armazenamento**: Tokens são salvos criptografados/protegidos no banco de dados.

### B. Fluxo de Sincronização
1.  **Manual**: Usuário clica em "Sincronizar Agora" na Dashboard.
2.  **Automático (Background)**: Cloud Scheduler roda a cada 6h para usuários conectados (Opcional/Futuro).
3.  **Processamento**:
    *   Backend busca dados "crus" da API externa (JSON do Google/Fitbit).
    *   Backend "normaliza" para o formato `Horamed Standard`.
    *   Backend salva no Firestore.

## 3. Modelo de Dados (Firestore)

### Coleção: `integrations` (Subcoleção de User)
Armazena o estado da conexão.
```typescript
path: users/{uid}/integrations/{providerId} // ex: google_fit, fitbit
{
  provider: "google_fit",
  status: "active" | "error",
  lastSync: Timestamp,
  config: {
    syncSteps: true,
    syncSleep: true,
    syncHeartRate: true
  },
  // Tokens são armazenados via Cloud Functions/Secret Manager idealmente,
  // ou aqui com RLS (Row Level Security) estrito apenas para o servidor.
}
```

### Coleção: `health_daily_summary` (Subcoleção de User)
Dados normalizados para gráficos.
```typescript
path: users/{uid}/health_daily_summary/{YYYY-MM-DD}
{
  date: "2024-02-20",
  steps: 8432,
  distance_meters: 5400,
  calories_burned: 450,
  sleep_minutes: 420, // 7 horas
  resting_heart_rate: 68,
  sources: ["google_fit"]
}
```

## 4. Componentes de UI (Frontend)

1.  **`IntegrationsHub.tsx`**:
    *   Lista de provedores em Grid.
    *   Cards com logo (Google Fit, Fitbit, Garmin, Oura).
    *   Botão toggle "Conectar/Desconectar".
    *   Status de "Última sincronização".

2.  **`PermissionModal.tsx`**:
    *   Explica *por que* precisamos dos dados ("Usaremos seus passos para calcular sua atividade diária").
    *   Mostra quais dados serão lidos.

3.  **`HealthDashboardAdapter.tsx`**:
    *   Atualizar a Dashboard existente para ler de `health_daily_summary` além dos dados manuais.

## 5. Estratégia de Implementação (Fases)

### Fase 1: Fundação & Interface (Atual)
*   Criar telas de "Hub de Integrações".
*   Criar Schemas no Firestore.
*   Criar "Simulador de Provedor" (Mock) para testar o fluxo de dados sem precisar de aprovação do Google ainda.

### Fase 2: Google Fit (MVP Real)
*   Integrar API REST do Google Fitness.
*   Implementar fluxo OAuth básico.

### Fase 3: Expansão
*   Adicionar Fitbit/Garmin.
*   Adicionar normalização complexa (ex: fases do sono).

## 6. Próximos Passos Imediatos
1.  Criar o componente UI `IntegrationsHub`.
2.  Implementar o serviço `IntegrationService` (inicialmente com dados mockados para validar a UI e fluxo).
