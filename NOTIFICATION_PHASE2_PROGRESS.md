# 🚀 FASE 2 - Garantir Funcionamento Mobile (App Fechado)

**Data**: 2026-02-02  
**Status**: 🟡 **EM PROGRESSO** (40% concluído)

---

## ✅ O Que Foi Implementado

### 1. **Utilitário de Permissões Android** (`androidPermissions.ts`)
- ✅ Função `checkExactAlarmPermission()` - Verifica permissão SCHEDULE_EXACT_ALARM
- ✅ Função `requestExactAlarmPermission()` - Solicita permissão (abre Settings)
- ✅ Função `checkBatteryOptimization()` - Verifica se app está otimizado
- ✅ Função `requestIgnoreBatteryOptimization()` - Abre configurações de bateria
- ✅ Função `getDeviceManufacturer()` - Identifica fabricante do dispositivo
- ✅ Função `getManufacturerInstructions()` - Instruções específicas por fabricante
  - Xiaomi / MIUI
  - Huawei / EMUI
  - Samsung / One UI
  - OnePlus / OxygenOS
  - Oppo / ColorOS
  - Vivo / Funtouch OS
  - Genérico (fallback)
- ✅ Função `getAndroidPermissionStatus()` - Status completo das permissões

### 2. **Componente AndroidPermissionsCard** (`AndroidPermissionsCard.tsx`)
- ✅ Card visual mostrando status de permissões
- ✅ Indicador de "Tudo OK" ou "Ação Necessária"
- ✅ Status de Alarmes Exatos (com botão "Ativar")
- ✅ Status de Otimização de Bateria (com botão "Desativar")
- ✅ Alerta quando há problemas
- ✅ Instruções expansíveis específicas por fabricante
- ✅ Informações do dispositivo
- ✅ Integrado em `NotificationSettings.tsx`

---

## 📊 Estrutura de Permissões Android

### Permissões Necessárias:

1. **SCHEDULE_EXACT_ALARM** (Android 12+)
   - Permite agendar alarmes em horários exatos
   - Necessário para notificações precisas
   - Requer ativação manual pelo usuário

2. **Battery Optimization Exemption**
   - Impede que o Android mate o app em background
   - Crucial para notificações com app fechado
   - Varia muito por fabricante

### Fabricantes com Otimização Agressiva:
- 🔴 **Xiaomi** - Mais restritivo (MIUI)
- 🔴 **Huawei** - Muito restritivo (EMUI)
- 🟡 **Samsung** - Moderado (One UI)
- 🟡 **OnePlus** - Moderado (OxygenOS)
- 🟡 **Oppo** - Moderado (ColorOS)
- 🟡 **Vivo** - Moderado (Funtouch OS)

---

## 🎨 UI Implementada

### AndroidPermissionsCard (Apenas Android)
```
┌─────────────────────────────────────────┐
│ 🔋 Permissões Android    [Tudo OK]     │
├─────────────────────────────────────────┤
│ ✅ Alarmes Exatos                       │
│    Necessário para notificações precisas│
│                                          │
│ ⚠️  Otimização de Bateria   [Desativar] │
│    App está sendo otimizado              │
├─────────────────────────────────────────┤
│ ⚠️ Atenção: Notificações podem não      │
│    funcionar corretamente. Siga as      │
│    instruções abaixo.                   │
├─────────────────────────────────────────┤
│ 📱 Instruções para Xiaomi / MIUI   [▼] │
│                                          │
│ 1. Abra Configurações > Apps...         │
│ 2. Encontre 'HoraMed'...                │
│ ...                                      │
├─────────────────────────────────────────┤
│ Dispositivo: Xiaomi Redmi Note 12       │
│ (Android 13)                             │
└─────────────────────────────────────────┘
```

---

## ⚠️ Limitações Atuais

### Funcionalidades que Precisam de Plugin Nativo:

1. **Detecção de Fabricante**
   - Atualmente retorna "Unknown"
   - Precisa de plugin Capacitor customizado
   - Alternativa: Usar User-Agent parsing

2. **Verificação Real de Permissões**
   - `checkExactAlarmPermission()` usa fallback
   - `checkBatteryOptimization()` assume worst-case
   - Precisa de plugin nativo para verificação real

3. **Abertura de Settings**
   - `requestExactAlarmPermission()` não abre settings
   - `requestIgnoreBatteryOptimization()` não abre settings
   - Precisa de plugin nativo para deep links

### Solução Temporária:
- Mostrar instruções detalhadas
- Usuário segue manualmente
- Validar após reload da página

---

## 🔧 Próximos Passos - FASE 2

### A. Criar Plugin Capacitor Customizado
**Prioridade**: 🔴 **ALTA**

```typescript
// android-permissions-plugin
export interface AndroidPermissionsPlugin {
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<void>;
  checkBatteryOptimization(): Promise<{ optimized: boolean }>;
  requestIgnoreBatteryOptimization(): Promise<void>;
  getDeviceInfo(): Promise<{
    manufacturer: string;
    model: string;
    androidVersion: number;
  }>;
}
```

**Arquivos necessários**:
- `android/src/main/java/.../AndroidPermissionsPlugin.java`
- `src/definitions.ts`
- `src/web.ts`
- `package.json`

### B. Implementar iOS Background Modes
**Prioridade**: 🔴 **ALTA**

1. **Atualizar `Info.plist`**
   ```xml
   <key>UIBackgroundModes</key>
   <array>
     <string>remote-notification</string>
     <string>processing</string>
   </array>
   ```

2. **Verificar Certificados Push**
   - Firebase Console > Project Settings > Cloud Messaging
   - Upload APNs Authentication Key (.p8)
   - Configurar Team ID e Key ID

3. **Testar com App Terminado**
   - Não apenas background, mas totalmente fechado
   - Verificar se notificações chegam

### C. Melhorar NotificationService
**Prioridade**: 🟡 **MÉDIA**

1. **Adicionar Fallback para Android < 12**
   ```typescript
   if (androidVersion >= 12) {
     // Use setExactAndAllowWhileIdle
   } else {
     // Use setAndAllowWhileIdle
   }
   ```

2. **Implementar Retry Logic**
   - Se agendamento falhar, tentar novamente
   - Logar falhas para diagnóstico

3. **Adicionar Telemetria**
   - Rastrear taxa de sucesso de notificações
   - Identificar dispositivos problemáticos

### D. Criar Guia de Troubleshooting
**Prioridade**: 🟢 **BAIXA**

- Página dedicada `/ajuda/notificacoes`
- FAQ com problemas comuns
- Vídeos demonstrativos por fabricante

---

## 🧪 Como Testar (Quando Plugin Estiver Pronto)

### Teste 1: Verificação de Permissões
1. Abrir `/notificacoes` em dispositivo Android
2. Verificar se AndroidPermissionsCard aparece
3. Confirmar se status está correto
4. Clicar em "Ativar" para alarmes exatos
5. Verificar se abre Settings do Android
6. Ativar permissão manualmente
7. Voltar ao app e verificar se status atualiza

### Teste 2: Otimização de Bateria
1. Clicar em "Desativar" na otimização de bateria
2. Verificar se abre Settings corretos
3. Desabilitar otimização manualmente
4. Voltar e verificar atualização

### Teste 3: Instruções por Fabricante
1. Testar em Xiaomi, Samsung, Huawei
2. Verificar se instruções corretas aparecem
3. Seguir passos e confirmar funcionamento

### Teste 4: Notificação com App Fechado
1. Agendar medicamento para 2 minutos
2. Fechar app completamente (swipe up)
3. Aguardar notificação
4. Verificar se chegou no horário exato

---

## 📝 Checklist de Implementação

### Android
- [x] Criar `androidPermissions.ts`
- [x] Criar `AndroidPermissionsCard.tsx`
- [x] Integrar em `NotificationSettings.tsx`
- [x] Adicionar instruções por fabricante
- [ ] Criar plugin Capacitor nativo
- [ ] Implementar verificação real de permissões
- [ ] Implementar abertura de Settings
- [ ] Testar em dispositivos reais (Xiaomi, Samsung, etc.)
- [ ] Adicionar fallback para Android < 12
- [ ] Implementar retry logic
- [ ] Adicionar telemetria

### iOS
- [ ] Atualizar `Info.plist` com Background Modes
- [ ] Configurar APNs no Firebase Console
- [ ] Criar componente `IOSPermissionsCard`
- [ ] Verificar Notification Service Extension
- [ ] Testar com app terminado
- [ ] Validar certificados Push
- [ ] Implementar retry logic
- [ ] Adicionar telemetria

### Geral
- [ ] Criar página de troubleshooting
- [ ] Adicionar FAQ
- [ ] Criar vídeos demonstrativos
- [ ] Documentar casos de uso
- [ ] Testes em produção

---

## 📚 Recursos e Referências

### Android
- [Schedule exact alarms](https://developer.android.com/training/scheduling/alarms)
- [Battery optimization](https://developer.android.com/training/monitoring-device-state/doze-standby)
- [Manufacturer-specific issues](https://dontkillmyapp.com/)

### iOS
- [Background Modes](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [APNs Configuration](https://firebase.google.com/docs/cloud-messaging/ios/client)

### Capacitor
- [Creating Plugins](https://capacitorjs.com/docs/plugins/creating-plugins)
- [Android Plugin Development](https://capacitorjs.com/docs/plugins/android)

---

**Status Atual**: 🟡 **40% COMPLETO**  
**Bloqueador Principal**: Necessário criar plugin Capacitor nativo  
**Próximo Passo**: Implementar plugin ou usar biblioteca existente (ex: `@capacitor-community/background-task`)
