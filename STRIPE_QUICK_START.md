# 🚀 Guia Rápido - 3 Passos para Ativar Produção

## ✅ JÁ FEITO (Automático)
- ✅ Chaves configuradas no Firebase
- ✅ Price IDs atualizados no código
- ✅ Functions deployed

---

## 📝 VOCÊ PRECISA FAZER (3 minutos)

### 1️⃣ Configurar Trial nos Produtos (2 min)

**Acesse:** https://dashboard.stripe.com/products

Para **CADA** um dos 4 produtos:

```
1. Clicar no produto
2. Clicar no preço (price_...)
3. Clicar em "⋮" (três pontos) > Edit
4. Procurar "Trial period"
5. Selecionar "7 days"
6. Clicar em "Save"
```

**Produtos:**
- ✅ HoraMed Premium Mensal (BRL) - R$ 19,90/mês
- ✅ HoraMed Premium Anual (BRL) - R$ 199,90/ano
- ✅ HoraMed Premium Monthly (USD) - $3.99/mês
- ✅ HoraMed Premium Annual (USD) - $39.90/ano

---

### 2️⃣ Verificar Webhook (30 seg)

**Acesse:** https://dashboard.stripe.com/webhooks

**Verificar:**
- ✅ URL: `https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook`
- ✅ Status: **Enabled** (verde)
- ✅ Eventos: 3 eventos configurados

**Se não existir:**
1. Clicar em "Add endpoint"
2. URL: `https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook`
3. Selecionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar o Signing secret e atualizar no Firebase

---

### 3️⃣ Testar Checkout (30 seg)

**Acesse:** https://horamed.app

```
1. Fazer login
2. Ir para "Planos"
3. Clicar em "Assinar Premium"
4. Verificar se mostra "7 dias grátis" ✅
5. Usar cartão de teste:
   Número: 4242 4242 4242 4242
   Data: 12/26
   CVC: 123
6. Completar checkout
```

**Verificar após:**
- ✅ Redirecionamento funcionou
- ✅ Aparece "Premium" no app
- ✅ Subscription criada no Stripe Dashboard

---

## 🎯 Pronto!

Se tudo funcionou:
- ✅ Sistema em produção
- ✅ Aceitando pagamentos reais
- ✅ Trial de 7 dias funcionando

---

## 🆘 Problemas?

### Trial não aparece
→ Voltar no passo 1️⃣ e configurar trial

### Webhook não funciona
→ Verificar URL no passo 2️⃣

### Erro no checkout
→ Ver logs: `firebase functions:log`

---

**Tempo total:** ~3 minutos  
**Arquivos de referência:**
- `STRIPE_PRODUCTION_STATUS.md` - Status completo
- `STRIPE_VERIFICATION_CHECKLIST.md` - Checklist detalhado
