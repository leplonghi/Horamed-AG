# 🚀 Configuração do Stripe para Produção

## Status Atual
- ✅ Código atualizado para usar variáveis de ambiente
- ⚠️ Aguardando configuração das chaves de produção

## Passo a Passo para Ativar Modo Produção

### 1. Criar Produtos no Stripe Live

Acesse o [Stripe Dashboard](https://dashboard.stripe.com) e certifique-se de estar no modo **Live** (não Test).

#### Produtos BRL (Brasil)
1. Criar produto: **HoraMed Premium Mensal (BRL)**
   - Preço: R$ 19,90/mês
   - Moeda: BRL
   - Tipo: Recorrente (mensal)
   - ⚠️ **Configurar Trial**: 7 dias gratuitos
   - Copiar o Price ID (formato: `price_xxxxx`)

2. Criar produto: **HoraMed Premium Anual (BRL)**
   - Preço: R$ 199,90/ano
   - Moeda: BRL
   - Tipo: Recorrente (anual)
   - ⚠️ **Configurar Trial**: 7 dias gratuitos
   - Copiar o Price ID

#### Produtos USD (Internacional)
1. Criar produto: **HoraMed Premium Monthly (USD)**
   - Preço: $3.99/mês
   - Moeda: USD
   - Tipo: Recorrente (mensal)
   - ⚠️ **Configurar Trial**: 7 dias gratuitos
   - Copiar o Price ID

2. Criar produto: **HoraMed Premium Annual (USD)**
   - Preço: $39.99/ano
   - Moeda: USD
   - Tipo: Recorrente (anual)
   - ⚠️ **Configurar Trial**: 7 dias gratuitos
   - Copiar o Price ID

### 2. Configurar Webhook (Produção)

1. No Stripe Dashboard (Live mode), vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook`
4. Selecionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copiar o **Webhook Secret** (formato: `whsec_xxxxx`)

### 3. Obter Chaves de Produção

No Stripe Dashboard (Live mode), vá em **Developers > API keys**:
- Copiar **Secret key** (formato: `sk_live_xxxxx`)
- ⚠️ **NUNCA** commitar essa chave no código!

### 4. Configurar Variáveis de Ambiente no Firebase

Execute os seguintes comandos no terminal:

```bash
# Configurar chave secreta do Stripe (LIVE)
firebase functions:config:set stripe.secret_key="sk_live_SEU_CODIGO_AQUI"

# Configurar webhook secret (LIVE)
firebase functions:config:set stripe.webhook_secret="whsec_SEU_CODIGO_AQUI"

# Verificar configuração
firebase functions:config:get
```

### 5. Atualizar Price IDs no Código

Editar `functions/src/index.ts` (linhas 58-67):

```typescript
const PRICES = {
    BRL: {
        monthly: 'price_XXXXX',  // Substituir pelo Price ID Live (BRL Mensal)
        annual: 'price_XXXXX',   // Substituir pelo Price ID Live (BRL Anual)
    },
    USD: {
        monthly: 'price_XXXXX',  // Substituir pelo Price ID Live (USD Mensal)
        annual: 'price_XXXXX',   // Substituir pelo Price ID Live (USD Anual)
    },
} as const;
```

### 6. Deploy das Funções

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 7. Testar em Produção

1. Acessar o app em produção
2. Tentar assinar o plano premium
3. Verificar no Stripe Dashboard (Live) se:
   - Cliente foi criado
   - Subscription foi criada
   - Trial de 7 dias está ativo
   - Webhook foi recebido

## ⚠️ Checklist de Segurança

- [ ] Chaves de produção configuradas via `firebase functions:config:set`
- [ ] Webhook configurado com URL de produção
- [ ] Price IDs atualizados no código
- [ ] Trial de 7 dias configurado em todos os produtos
- [ ] Testado com cartão real (ou Stripe test cards em Live mode)
- [ ] Logs do Firebase Functions verificados

## 🔄 Rollback para Teste

Se precisar voltar para modo de teste:

```bash
# Configurar chave de teste
firebase functions:config:set stripe.secret_key="sk_test_REMOVED"

# Redeployar
firebase deploy --only functions
```

## 📞 Suporte

Se encontrar erros:
1. Verificar logs: `firebase functions:log`
2. Verificar Stripe Dashboard > Developers > Logs
3. Verificar se webhook está recebendo eventos

---

**Última atualização**: 2026-02-02
**Status**: Aguardando configuração de chaves de produção
