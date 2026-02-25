# 🔔 Plano de Melhorias - Sistema de Notificações HoraMed

**Data**: 2026-02-02  
**Objetivo**: Garantir notificações editáveis e funcionais com app fechado (mobile + desktop)

---

## 📋 Problemas Identificados

### 1. **Falta de Edição de Horários de Alerta**
- **Localização**: `src/pages/NotificationSettings.tsx` (linhas 315-336)
- **Problema**: Switches dos horários (15 min, 5 min, hora exata) estão `disabled`
- **Impacto**: Usuário não consegue personalizar quando quer ser alertado

### 2. **Notificações com App Fechado - Mobile**
- **Android**: 
  - ✅ Canal criado (`horamed_alarm`) com `IMPORTANCE_HIGH`
  - ✅ `allowWhileIdle: true` configurado
  - ⚠️ Falta: Verificação de Battery Optimization e Doze Mode
  - ⚠️ Falta: Exact Alarm Permission (Android 12+)
  
- **iOS**:
  - ✅ Push Notifications configuradas
  - ⚠️ Falta: Background Modes habilitados
  - ⚠️ Falta: Notification Service Extension para rich notifications

### 3. **Notificações com App Fechado - Desktop/Web**
- **Service Worker**: Existe mas precisa verificar registro
- **Web Push**: Implementado mas falta validação de funcionamento
- **Problema**: `setTimeout` não funciona com app fechado - precisa de Service Worker Scheduler

### 4. **Falta de Integração do Editor**
- **Componente**: `NotificationScheduleEditor.tsx` existe e está completo
- **Problema**: Não está sendo usado em `NotificationSettings.tsx`
- **Solução**: Integrar editor para permitir customização completa

---

## 🎯 Plano de Implementação

### **FASE 1: Edição de Horários de Alerta** ⏱️ 30 min

#### 1.1. Tornar Switches Editáveis
- [ ] Remover `disabled` dos switches (linhas 320, 327, 334)
- [ ] Criar estado para gerenciar horários ativos
- [ ] Adicionar lógica de salvamento no Firestore
- [ ] Permitir adicionar/remover horários customizados

#### 1.2. Integrar NotificationScheduleEditor
- [ ] Adicionar botão "Gerenciar Horários" na seção "Horários de Alerta"
- [ ] Conectar com `NotificationScheduleEditor`
- [ ] Salvar configurações em `notification_preferences`
- [ ] Aplicar horários customizados ao agendar notificações

**Arquivos a Modificar**:
- `src/pages/NotificationSettings.tsx`
- `src/services/NotificationService.ts` (aplicar horários customizados)

---

### **FASE 2: Garantir Funcionamento Mobile (App Fechado)** ⏱️ 1h

#### 2.1. Android - Exact Alarms e Battery Optimization
- [ ] Adicionar verificação de `SCHEDULE_EXACT_ALARM` permission (Android 12+)
- [ ] Criar prompt para desabilitar Battery Optimization
- [ ] Adicionar instruções no `NotificationSetup.tsx`
- [ ] Implementar fallback para `setAndAllowWhileIdle`

**Novo Arquivo**: `src/utils/androidPermissions.ts`
```typescript
export async function requestExactAlarmPermission(): Promise<boolean>
export async function checkBatteryOptimization(): Promise<boolean>
export async function requestIgnoreBatteryOptimization(): Promise<void>
```

#### 2.2. iOS - Background Modes
- [ ] Verificar `Info.plist` tem `UIBackgroundModes` com `remote-notification`
- [ ] Confirmar certificados de Push Notification no Firebase Console
- [ ] Testar notificações com app em background e terminado

**Arquivo a Verificar**: `ios/App/App/Info.plist`

#### 2.3. Melhorar Diagnóstico
- [ ] Adicionar verificação de permissões exatas no `NotificationDiagnostics`
- [ ] Mostrar status de Battery Optimization
- [ ] Adicionar teste de notificação com app fechado

---

### **FASE 3: Garantir Funcionamento Desktop/Web (App Fechado)** ⏱️ 1h

#### 3.1. Service Worker - Notification Scheduler
- [ ] Verificar registro do Service Worker
- [ ] Implementar `Notification Triggers API` (Chrome) ou fallback
- [ ] Usar `postMessage` para agendar notificações no SW
- [ ] Persistir agendamentos no IndexedDB

**Arquivo a Modificar**: `public/sw.js` ou criar `src/sw/notifications.ts`

#### 3.2. Web Push - Validação
- [ ] Testar fluxo completo de Web Push
- [ ] Verificar VAPID keys no Firebase Functions
- [ ] Confirmar `sendDoseNotification` function está deployada
- [ ] Adicionar retry logic para falhas de push

**Arquivos a Verificar**:
- `functions/src/notifications/sendDoseNotification.ts`
- `src/hooks/usePushNotifications.ts` (linha 166-247)

#### 3.3. Fallback para Browsers sem Service Worker
- [ ] Detectar suporte a Service Worker
- [ ] Mostrar aviso se não suportado
- [ ] Sugerir instalação de app mobile ou uso de Chrome/Edge

---

### **FASE 4: Testes e Validação** ⏱️ 30 min

#### 4.1. Testes Mobile
- [ ] Android: Testar com app fechado, tela bloqueada, Doze Mode
- [ ] iOS: Testar com app em background e terminado
- [ ] Verificar som, vibração e ações (Tomei, Snooze, Pular)

#### 4.2. Testes Desktop/Web
- [ ] Testar notificações com navegador minimizado
- [ ] Testar com navegador fechado (Service Worker)
- [ ] Verificar persistência após reiniciar navegador

#### 4.3. Testes de Edição
- [ ] Adicionar horário customizado (ex: 10 min antes)
- [ ] Remover horário padrão (ex: 15 min)
- [ ] Salvar e verificar se aplica corretamente

---

## 📦 Estrutura de Dados

### `notification_preferences` (Firestore)
```typescript
{
  userId: string;
  pushEnabled: boolean;
  pushToken?: string;
  alertMinutes: number[]; // Ex: [15, 5, 0] ou [30, 10, 5, 0]
  quietHours?: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "06:00"
  };
  customSchedules?: {
    [medicationId: string]: NotificationSchedule[];
  };
  updatedAt: string;
}
```

---

## 🚀 Ordem de Execução Recomendada

1. **FASE 1** (Edição) - Impacto imediato na UX
2. **FASE 2** (Mobile) - Maior base de usuários
3. **FASE 3** (Desktop/Web) - Complementar
4. **FASE 4** (Testes) - Validação final

---

## ⚠️ Considerações Importantes

### Android 12+ (API 31+)
- Requer `SCHEDULE_EXACT_ALARM` permission explícita
- Usuário precisa aprovar manualmente nas configurações
- Fallback: `setAndAllowWhileIdle` (menos preciso, mas funciona)

### iOS
- Notificações locais funcionam com app terminado
- Push notifications requerem certificado válido
- Background fetch tem limites de frequência do sistema

### Web/Desktop
- Service Worker funciona apenas em HTTPS (ou localhost)
- Notification Triggers API ainda experimental (Chrome only)
- Fallback: Pedir ao usuário manter aba aberta ou instalar PWA

### Battery Optimization
- Alguns fabricantes (Xiaomi, Huawei, Samsung) têm otimizações agressivas
- Precisa de instruções específicas por fabricante
- Considerar adicionar guia de troubleshooting

---

## 📚 Recursos e Referências

- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Android Exact Alarms](https://developer.android.com/about/versions/12/behavior-changes-12#exact-alarm-permission)
- [iOS Background Modes](https://developer.apple.com/documentation/usernotifications/scheduling_a_notification_locally_from_your_app)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Worker Scheduler](https://developer.chrome.com/blog/notification-triggers/)

---

## ✅ Critérios de Sucesso

- [ ] Usuário consegue editar todos os horários de alerta
- [ ] Notificações funcionam com app fechado no Android
- [ ] Notificações funcionam com app fechado no iOS
- [ ] Notificações funcionam com navegador minimizado (desktop)
- [ ] Diagnóstico mostra status claro de todas as permissões
- [ ] Documentação de troubleshooting disponível para usuários

---

**Próximo Passo**: Iniciar FASE 1 - Edição de Horários de Alerta
