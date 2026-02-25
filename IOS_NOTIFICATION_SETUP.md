# 📱 Configuração iOS para Notificações em Background

## 1. Atualizar Info.plist

Adicione as seguintes configurações em `ios/App/App/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Existing keys... -->
    
    <!-- Background Modes para notificações -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
        <string>processing</string>
        <string>fetch</string>
    </array>
    
    <!-- Descrição de uso de notificações (obrigatório) -->
    <key>NSUserNotificationsUsageDescription</key>
    <string>Precisamos enviar notificações para lembrá-lo de tomar seus medicamentos nos horários corretos</string>
    
    <!-- Permitir notificações críticas (opcional, mas recomendado) -->
    <key>UNAuthorizationOptionCriticalAlert</key>
    <true/>
    
</dict>
</plist>
```

## 2. Configurar APNs no Firebase Console

### Passo 1: Gerar APNs Authentication Key

1. Acesse [Apple Developer](https://developer.apple.com/account/resources/authkeys/list)
2. Clique em **"+"** para criar uma nova chave
3. Dê um nome (ex: "HoraMed Push Notifications")
4. Marque **"Apple Push Notifications service (APNs)"**
5. Clique em **"Continue"** e depois **"Register"**
6. **Baixe o arquivo `.p8`** (você só pode fazer isso uma vez!)
7. Anote o **Key ID** (ex: `ABC123XYZ`)
8. Anote o **Team ID** (encontre em Account > Membership)

### Passo 2: Upload no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto **HoraMed**
3. Vá em **Project Settings** (ícone de engrenagem)
4. Aba **Cloud Messaging**
5. Role até **Apple app configuration**
6. Clique em **Upload** em "APNs Authentication Key"
7. Faça upload do arquivo `.p8`
8. Insira o **Key ID**
9. Insira o **Team ID**
10. Clique em **Upload**

## 3. Configurar Capabilities no Xcode

1. Abra o projeto no Xcode:
   ```bash
   npx cap open ios
   ```

2. Selecione o target **App**

3. Vá na aba **Signing & Capabilities**

4. Clique em **"+ Capability"** e adicione:
   - **Push Notifications**
   - **Background Modes**
     - Marque: "Remote notifications"
     - Marque: "Background fetch"
     - Marque: "Background processing"

## 4. Verificar Bundle Identifier

Certifique-se de que o Bundle Identifier no Xcode corresponde ao configurado no Firebase:

- **Xcode**: `com.horamed.app` (ou o que você configurou)
- **Firebase**: Deve ser o mesmo

## 5. Testar Notificações

### Teste Local (Simulator)
⚠️ **Nota**: Simulador iOS não suporta push notifications reais. Você precisa de um dispositivo físico.

### Teste em Dispositivo Real

1. Conecte um iPhone/iPad via cabo
2. Selecione o dispositivo no Xcode
3. Build e Run (Cmd + R)
4. Aceite permissões de notificação quando solicitado
5. Agende um medicamento para 2 minutos
6. Feche o app completamente (swipe up)
7. Aguarde a notificação

### Teste de Push Remoto

Use a ferramenta de teste do Firebase:

1. Firebase Console > Cloud Messaging
2. Clique em "Send test message"
3. Insira o FCM token do dispositivo
4. Envie a mensagem
5. Verifique se chegou mesmo com app fechado

## 6. Troubleshooting

### Notificações não chegam com app fechado

**Verificar**:
- [ ] Background Modes estão ativados no Xcode
- [ ] APNs key está configurado no Firebase
- [ ] Bundle ID está correto
- [ ] Certificado de desenvolvimento/produção está válido
- [ ] Dispositivo tem conexão com internet
- [ ] Notificações estão ativadas nas configurações do iOS

**Comandos úteis**:
```bash
# Verificar se o app está registrado para push
# No console do Xcode, procure por:
# "Registered for push notifications with token: <TOKEN>"

# Verificar logs do sistema
# Abra Console.app no Mac
# Conecte o iPhone
# Filtre por "HoraMed" ou "apsd" (Apple Push Service Daemon)
```

### Erro "No valid 'aps-environment' entitlement"

**Solução**:
1. Xcode > Signing & Capabilities
2. Adicione "Push Notifications" capability
3. Clean Build Folder (Cmd + Shift + K)
4. Build novamente

### Token não é gerado

**Verificar**:
1. Push Notifications capability está adicionada
2. Provisioning profile inclui push notifications
3. App está rodando em dispositivo real (não simulator)

## 7. Configuração de Produção

### Antes de publicar na App Store:

1. **Gerar Production APNs Certificate**:
   - Mesmo processo do passo 2, mas use certificado de produção
   - Upload no Firebase Console

2. **Atualizar Provisioning Profile**:
   - Use Distribution profile
   - Inclua Push Notifications

3. **Testar com TestFlight**:
   - Build de produção
   - Distribua via TestFlight
   - Teste notificações antes de submeter para review

## 8. Checklist Final

- [ ] Info.plist atualizado com UIBackgroundModes
- [ ] APNs key gerado e uploadado no Firebase
- [ ] Push Notifications capability adicionada no Xcode
- [ ] Background Modes configurados
- [ ] Bundle ID correto
- [ ] Testado em dispositivo real
- [ ] Notificações chegam com app fechado
- [ ] Notificações chegam com app em background
- [ ] Sons funcionam corretamente
- [ ] Badges atualizam corretamente

---

## 📚 Recursos Adicionais

- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)
- [Firebase Cloud Messaging iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Background Modes](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)

---

**Status**: ✅ Pronto para implementação
