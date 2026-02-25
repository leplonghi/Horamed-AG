# ✅ Checklist de Verificação - Stripe Produção

**Data:** 2026-02-02  
**Status:** Aguardando verificação manual

---

## 🎯 Checklist de Verificação

### 1️⃣ Webhook Configuration
**Acesse:** https://dashboard.stripe.com/webhooks

- [ ] **Webhook existe** com URL: `https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook`
- [ ] **Status:** Enabled (ativo)
- [ ] **Eventos configurados:**
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] **Signing secret** corresponde a: `whsec_zYRSBxR1p...` (primeiros 15 caracteres)
- [ ] **Sem erros de delivery** (delivery errors = 0)

**Se houver problemas:**
- Clicar em "Send test webhook" para testar
- Verificar logs em "Recent deliveries"

---

### 2️⃣ Produtos e Preços (Live Mode)
**Acesse:** https://dashboard.stripe.com/products

#### 🇧🇷 Produto BRL - Mensal
- [ ] **Nome:** HoraMed Premium Mensal (BRL)
- [ ] **Preço:** R$ 19,90/mês
- [ ] **Price ID:** `price_1QsLkuHh4P8HSV4Yqcv6t`
- [ ] **Trial:** 7 dias gratuitos ✅
- [ ] **Tipo:** Recorrente (mensal)
- [ ] **Status:** Ativo

#### 🇧🇷 Produto BRL - Anual
- [ ] **Nome:** HoraMed Premium Anual (BRL)
- [ ] **Preço:** R$ 199,90/ano
- [ ] **Price ID:** `price_1QsgmHh4P8HSV4Yb4o1ovt`
- [ ] **Trial:** 7 dias gratuitos ✅
- [ ] **Tipo:** Recorrente (anual)
- [ ] **Status:** Ativo

#### 🌎 Produto USD - Monthly
- [ ] **Nome:** HoraMed Premium Monthly (USD)
- [ ] **Preço:** $3.99/mês
- [ ] **Price ID:** `price_1QsLkNHh4P8HSV4Yds1xcc`
- [ ] **Trial:** 7 dias gratuitos ✅
- [ ] **Tipo:** Recorrente (mensal)
- [ ] **Status:** Ativo

#### 🌎 Produto USD - Annual
- [ ] **Nome:** HoraMed Premium Annual (USD)
- [ ] **Preço:** $39.90/ano
- [ ] **Price ID:** `price_1QsuHHh4P8HSV4Ysgmzc2V`
- [ ] **Trial:** 7 dias gratuitos ✅
- [ ] **Tipo:** Recorrente (anual)
- [ ] **Status:** Ativo

---

### 3️⃣ Teste de Checkout (Produção)

#### Preparação:
1. Acessar: https://horamed.app (ou URL de produção)
2. Fazer login ou criar conta
3. Ir para "Planos" ou "Assinar Premium"

#### Verificações:
- [ ] **Trial aparece:** "7 dias grátis" está visível
- [ ] **Preços corretos:**
  - [ ] Brasil: R$ 19,90/mês ou R$ 199,90/ano
  - [ ] Internacional: $3.99/mês ou $39.90/ano
- [ ] **Checkout abre** sem erros
- [ ] **Stripe Checkout** carrega corretamente

#### Teste com Cartão de Teste:
**Cartão:** `4242 4242 4242 4242`  
**Data:** Qualquer data futura (ex: 12/26)  
**CVC:** Qualquer 3 dígitos (ex: 123)  
**CEP:** Qualquer (ex: 12345)

- [ ] **Checkout completa** sem erros
- [ ] **Redirecionamento** funciona após pagamento
- [ ] **Subscription criada** no Stripe Dashboard
- [ ] **Trial de 7 dias** aparece na subscription
- [ ] **Webhook recebido** (verificar em Webhooks > Recent deliveries)

---

### 4️⃣ Verificação no Stripe Dashboard

**Acesse:** https://dashboard.stripe.com/subscriptions

Após teste de checkout:
- [ ] **Subscription aparece** na lista
- [ ] **Status:** Trialing (em trial)
- [ ] **Trial end date:** 7 dias a partir de hoje
- [ ] **Customer criado** corretamente
- [ ] **Metadata** presente (userId, etc.)

---

### 5️⃣ Verificação no Firebase

**Firestore Console:** https://console.firebase.google.com/project/horamed-firebase/firestore

Verificar documento do usuário:
- [ ] **Campo `isPremium`:** true
- [ ] **Campo `stripeCustomerId`:** preenchido (cus_...)
- [ ] **Campo `stripeSubscriptionId`:** preenchido (sub_...)
- [ ] **Subcoleção `subscription/current`:**
  - [ ] `status`: "trialing"
  - [ ] `planType`: "premium_monthly" ou "premium_annual"
  - [ ] `trialEndsAt`: data correta (7 dias)

---

### 6️⃣ Logs do Firebase Functions

**Console:** https://console.firebase.google.com/project/horamed-firebase/functions/logs

Verificar logs de `stripeWebhook`:
- [ ] **Sem erros** após checkout
- [ ] **Log de inicialização:** "[STRIPE] Initializing with key prefix: sk_live_..."
- [ ] **Eventos processados:** checkout.session.completed

---

## 🚨 Problemas Comuns

### ❌ Webhook não recebe eventos
**Solução:**
1. Verificar URL do webhook no Stripe
2. Testar com "Send test webhook"
3. Verificar se a função está deployed: `firebase functions:list`

### ❌ Trial não aparece
**Solução:**
1. Verificar configuração do produto no Stripe
2. Editar produto > Trial period > 7 days

### ❌ Erro ao criar checkout
**Solução:**
1. Verificar logs: `firebase functions:log`
2. Verificar se Price IDs estão corretos no código
3. Verificar se chave secreta está configurada

### ❌ Subscription não atualiza no Firestore
**Solução:**
1. Verificar webhook está recebendo eventos
2. Verificar logs do `stripeWebhook`
3. Verificar permissões do Firestore

---

## ✅ Conclusão

Quando todos os checkboxes estiverem marcados:
- [ ] **Sistema em produção** funcionando 100%
- [ ] **Pagamentos reais** podem ser aceitos
- [ ] **Trial de 7 dias** funcionando
- [ ] **Webhook** processando eventos
- [ ] **Firestore** sincronizado

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs: `firebase functions:log`
2. Verificar Stripe Dashboard > Developers > Logs
3. Verificar Stripe Dashboard > Webhooks > Recent deliveries

**Última atualização:** 2026-02-02 13:45
