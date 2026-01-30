# 🎉 Deploy Concluído - Próximos Passos

## ✅ Status Atual
- **13 Cloud Functions** implantadas com sucesso
- **Stripe Secret Key** configurada
- **Backend totalmente funcional**

---

## 🔗 URL Crítica do Webhook

Para o Stripe comunicar com seu app quando pagamentos forem aprovados, você precisa configurar esta URL:

```
https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook
```

---

## 📋 Como Configurar o Webhook no Stripe (Passo a Passo)

### 1. Acesse o Dashboard do Stripe
Abra: https://dashboard.stripe.com/webhooks

### 2. Clique em "Add endpoint" (Adicionar endpoint)

### 3. Cole a URL do Webhook
No campo "Endpoint URL", cole:
```
https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook
```

### 4. Selecione os Eventos
Marque os seguintes eventos para escutar:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

### 5. Clique em "Add endpoint"

### 6. Copie a Signing Secret
Após criar o webhook, clique em **"Reveal"** (Revelar) no campo "Signing secret".
Você verá uma chave que começa com `whsec_...`

**COPIE ESSA CHAVE!**

### 7. Configure a Chave no Firebase
Abra o arquivo `functions/.env` e adicione:
```
STRIPE_WEBHOOK_SECRET="whsec_SUA_CHAVE_AQUI"
```

### 8. Redeploy Final
Rode no terminal:
```bash
firebase deploy --only functions:stripeWebhook
```

---

## 🧪 Como Testar

Após configurar o webhook:

1. Vá em `app.horamed.net/planos`
2. Clique em "Assinar Premium"
3. Use o cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVV: Qualquer 3 dígitos

Se tudo funcionar, você verá:
- ✅ Redirecionamento para página de sucesso
- ✅ Status "Premium" no perfil
- ✅ Webhook recebido no Dashboard do Stripe

---

## 🔐 Próxima Configuração (Opcional mas Recomendada)

Para ativar a **IA de Saúde (Gemini)**:

1. Acesse: https://aistudio.google.com/app/apikey
2. Crie uma API Key
3. Adicione no `functions/.env`:
   ```
   GOOGLE_AI_API_KEY="AIza..."
   ```
4. Redeploy: `firebase deploy --only functions:healthAssistant`

---

## 📊 Funções Disponíveis

| Função | Tipo | Status |
|--------|------|--------|
| `createCheckoutSession` | Pagamentos | ✅ Ativo |
| `stripeWebhook` | Pagamentos | ⚠️ Precisa Webhook Secret |
| `createCustomerPortal` | Pagamentos | ✅ Ativo |
| `healthAssistant` | IA | ⚠️ Precisa Google AI Key |
| `sendDoseNotification` | Notificações | ✅ Ativo |
| `scheduleDoseNotifications` | Notificações | ✅ Ativo |
| `onUserCreate` | Auth | ✅ Ativo |
| `onUserDelete` | Auth | ✅ Ativo |

---

## ❓ Dúvidas?

Se algo não funcionar:
1. Verifique os logs: `firebase functions:log`
2. Teste o webhook no Stripe Dashboard (botão "Send test webhook")
3. Confirme que o `.env` está correto

**Você está a 1 passo de ter pagamentos funcionando! 🚀**
