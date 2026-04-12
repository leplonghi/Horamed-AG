# 🚨 ALERTA DE SEGURANÇA - AÇÃO IMEDIATA NECESSÁRIA

## ⚠️ SUAS CHAVES STRIPE FORAM EXPOSTAS

As chaves de API do Stripe que você compartilhou foram **expostas publicamente** e devem ser **revogadas imediatamente**.

---

## 🔴 PASSO 1: REVOGAR CHAVES EXPOSTAS (URGENTE!)

### 1.1 Acesse o Stripe Dashboard
- URL: https://dashboard.stripe.com/apikeys
- Faça login na sua conta

### 1.2 Revogue a Secret Key
1. Localize a seção "Secret keys"
2. Clique em "Reveal live key token"
3. Clique no botão **"Roll key"** ou **"Delete"**
4. Confirme a ação

### 1.3 Revogue a Publishable Key (se necessário)
1. Localize a seção "Publishable keys"
2. Se houver opção de revogar, faça o mesmo processo

---

## ✅ PASSO 2: GERAR NOVAS CHAVES

### 2.1 Criar Nova Secret Key
1. No mesmo dashboard (https://dashboard.stripe.com/apikeys)
2. Clique em **"Create secret key"**
3. Dê um nome descritivo (ex: "HoraMed Production")
4. **COPIE A CHAVE IMEDIATAMENTE** (ela só aparece uma vez!)
5. Formato: `sk_live_...` (produção) ou `sk_test_...` (teste)

### 2.2 Copiar Nova Publishable Key
1. A publishable key é gerada automaticamente
2. Copie a chave que começa com `pk_live_...` ou `pk_test_...`

---

## 🔧 PASSO 3: ATUALIZAR VARIÁVEIS DE AMBIENTE

### 3.1 Atualizar arquivo `.env` local

Abra o arquivo `c:\Antigravity\horamed\horamed\.env` e substitua:

```bash
# Substitua estas linhas pelas NOVAS chaves:
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_NOVA_CHAVE_AQUI"
STRIPE_SECRET_KEY="sk_live_NOVA_CHAVE_AQUI"
```

### 3.2 Atualizar Supabase Edge Functions

As Edge Functions do Supabase também precisam das chaves. Configure via CLI:

```bash
# Configurar STRIPE_SECRET_KEY
supabase secrets set STRIPE_SECRET_KEY=sk_live_NOVA_CHAVE_AQUI

# Configurar STRIPE_WEBHOOK_SECRET (vamos criar isso no próximo passo)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_WEBHOOK_SECRET_AQUI
```

Ou via Dashboard:
1. Acesse: https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/settings/vault
2. Adicione os secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

---

## 🔔 PASSO 4: CONFIGURAR WEBHOOKS DO STRIPE

### 4.1 Obter URL do Webhook

Primeiro, precisamos saber a URL pública da Edge Function `stripe-webhook`:

```
https://zmsuqdwleyqpdthaqvbi.supabase.co/functions/v1/stripe-webhook
```

### 4.2 Criar Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://zmsuqdwleyqpdthaqvbi.supabase.co/functions/v1/stripe-webhook`
   - **Description**: "HoraMed Subscription Events"
   - **Events to send**: Selecione os seguintes eventos:
     - ✅ `checkout.session.completed`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `customer.subscription.created`
4. Clique em **"Add endpoint"**

### 4.3 Copiar Webhook Secret

1. Após criar o webhook, clique nele
2. Na seção "Signing secret", clique em **"Reveal"**
3. Copie o secret (formato: `whsec_...`)
4. Adicione ao `.env`:

```bash
STRIPE_WEBHOOK_SECRET="whsec_COPIADO_DO_STRIPE"
```

5. Adicione também ao Supabase Secrets (passo 3.2)

---

## 🔍 PASSO 5: VERIFICAR ATIVIDADES SUSPEITAS

### 5.1 Verificar Pagamentos
- Acesse: https://dashboard.stripe.com/payments
- Verifique se há transações não autorizadas nas últimas horas

### 5.2 Verificar Logs de API
- Acesse: https://dashboard.stripe.com/logs
- Procure por chamadas de API suspeitas
- Filtre por "Last 24 hours"

### 5.3 Verificar Clientes e Assinaturas
- Clientes: https://dashboard.stripe.com/customers
- Assinaturas: https://dashboard.stripe.com/subscriptions

---

## 🛡️ PASSO 6: MEDIDAS DE SEGURANÇA ADICIONAIS

### 6.1 Ativar 2FA no Stripe
1. Acesse: https://dashboard.stripe.com/settings/user
2. Ative "Two-step authentication"

### 6.2 Configurar Alertas
1. Acesse: https://dashboard.stripe.com/settings/notifications
2. Ative notificações para:
   - Pagamentos bem-sucedidos
   - Pagamentos falhados
   - Disputas
   - Atividades suspeitas

### 6.3 Revisar Permissões de Equipe
- Acesse: https://dashboard.stripe.com/settings/team
- Verifique quem tem acesso à conta
- Remova acessos desnecessários

---

## 📋 CHECKLIST DE SEGURANÇA

Marque cada item conforme concluir:

- [x] Limpeza profunda realizada: Segredos removidos de `.env.firebase` e `.env.production`.
- [x] Verificação de sanidade implementada em `src/lib/securityCheck.ts`.
- [ ] Revogadas as chaves expostas no Stripe Dashboard (Ação do Usuário)
- [ ] Geradas novas Secret Key e Publishable Key
- [ ] Atualizado segredos no Firebase Console (`firebase functions:secrets:set STRIPE_SECRET_KEY`)
- [ ] Verificadas atividades suspeitas nos últimos dias
- [ ] Ativado 2FA na conta Stripe

---

## 🚀 PRÓXIMOS PASSOS (APÓS SEGURANÇA)

Depois de completar todos os passos de segurança acima, podemos:

1. ✅ Testar a conexão com Stripe
2. ✅ Listar produtos e preços
3. ✅ Verificar assinaturas ativas
4. ✅ Analisar webhooks e eventos
5. ✅ Criar produtos/preços se necessário

---

## 📞 SUPORTE

Se você suspeitar de atividade fraudulenta:
- **Stripe Support**: https://support.stripe.com/
- **Telefone**: Disponível no dashboard do Stripe

---

## ⚠️ LEMBRETE IMPORTANTE

**NUNCA compartilhe:**
- Secret Keys (`sk_live_...` ou `sk_test_...`)
- Webhook Secrets (`whsec_...`)
- Service Role Keys do Supabase
- Database passwords

**Sempre use:**
- Variáveis de ambiente (`.env`)
- Secrets managers (Supabase Vault, AWS Secrets Manager, etc.)
- `.gitignore` para proteger arquivos sensíveis
