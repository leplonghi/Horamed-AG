# 🤖 Tutorial Completo: ManyChat + HoraMed Campaign Generator

## O que é ManyChat?

ManyChat é uma plataforma de automação de mensagens para Instagram e Facebook que permite enviar DMs automaticamente quando alguém comenta em seus posts.

---

## 📋 Pré-requisitos

1. ✅ Conta Business no Instagram
2. ✅ Página do Facebook conectada ao Instagram
3. ✅ Conta no ManyChat (gratuita até 1.000 contatos)

---

## 🚀 Passo a Passo: Configuração Completa

### **ETAPA 1: Criar Conta no ManyChat**

1. Acesse: [https://manychat.com](https://manychat.com)
2. Clique em **"Start Free"**
3. Escolha **"Instagram"** como canal principal
4. Conecte sua conta do Instagram Business
5. Conecte sua Página do Facebook

**⚠️ Importante:** Seu Instagram PRECISA estar convertido para conta Business e vinculado a uma Página do Facebook.

---

### **ETAPA 2: Criar o Fluxo de Automação**

#### 2.1. Criar um Novo Flow

1. No painel do ManyChat, vá em **"Automation" → "Flows"**
2. Clique em **"+ New Flow"**
3. Nomeie: `"Campanha HoraMed - Keyword DM"`

#### 2.2. Configurar o Trigger (Gatilho)

1. Dentro do Flow, clique em **"Trigger"**
2. Escolha: **"Instagram Comment"**
3. Configure:
   - **Trigger Type:** `Comment contains keyword`
   - **Keywords:** `EU QUERO` (sem aspas)
   - **Match Type:** `Exact match` (ou `Contains` se quiser flexibilidade)

#### 2.3. Criar a Mensagem Automática

1. Adicione um bloco **"Send Message"**
2. Escreva a mensagem que será enviada na DM:

```
🎉 Parabéns! Você garantiu sua vaga!

Aqui está seu link exclusivo para 30 dias de Premium GRÁTIS no HoraMed:

👉 [COLE O LINK AQUI]

⏰ Válido apenas para as primeiras 100 pessoas.

Aproveite! 🚀
```

3. **Substitua `[COLE O LINK AQUI]`** pelo link gerado no Campaign Generator (ex: `https://horamed.app/auth?campaign=KEY_ABC123`)

#### 2.4. Adicionar Botão de Ação (Opcional)

1. No mesmo bloco de mensagem, clique em **"Add Button"**
2. Configure:
   - **Button Text:** `Acessar Agora ✅`
   - **Action:** `Open Website`
   - **URL:** Cole o link da campanha

---

### **ETAPA 3: Publicar e Testar**

1. Clique em **"Publish"** no canto superior direito
2. Vá no seu Instagram e faça um post de teste
3. Comente "EU QUERO" no seu próprio post
4. Verifique se recebeu a DM automática

**✅ Se funcionou:** Está pronto para lançar!

---

## 📱 Como Usar na Prática

### **Fluxo Completo:**

1. **Você cria a campanha** no HoraMed Campaign Generator (Keyword DM)
2. **Copia o link** gerado (ex: `https://horamed.app/auth?campaign=KEY_XYZ`)
3. **Cola o link** no ManyChat (dentro da mensagem automática)
4. **Publica no Instagram:**

```
🎁 PROMOÇÃO RELÂMPAGO! 🎁

As primeiras 100 pessoas que comentarem "EU QUERO" 
vão receber um link EXCLUSIVO na DM com 30 dias de Premium GRÁTIS.

⏰ Corre! Restam poucas vagas! 👇
```

5. **As pessoas comentam** "EU QUERO"
6. **ManyChat envia a DM** automaticamente com o link
7. **Elas clicam** e ganham o benefício
8. **Você monitora** no Dashboard do Campaign Generator

---

## 🎯 Estratégias Avançadas

### **1. Múltiplas Keywords**

Configure várias palavras-chave para capturar mais variações:
- `EU QUERO`
- `QUERO`
- `ME MANDA`
- `LINK`

### **2. Segmentação por Emoji**

Peça para comentarem um emoji específico:
- "Comente 🔥 para receber"
- "Comente ❤️ se você quer"

### **3. Sequência de Mensagens**

Envie 2-3 mensagens em sequência:
1. Primeira: "Parabéns! Processando..."
2. Segunda (após 5 segundos): "Aqui está seu link: [LINK]"
3. Terceira (após 1 hora): "Já testou? Me conta o que achou!"

---

## 📊 Monitoramento e Controle

### **No ManyChat:**
- Veja quantas pessoas comentaram
- Quantas DMs foram enviadas
- Taxa de abertura das mensagens

### **No HoraMed Dashboard:**
- Veja quantos links foram clicados
- Quantas vagas restam
- Quando atingir o limite (100), edite o post do Instagram:

```
✅ ESGOTADO! Obrigado a todos que participaram.

Próxima rodada em breve. Ative as notificações para não perder! 🔔
```

---

## ⚠️ Limitações e Cuidados

### **Limites do ManyChat (Plano Gratuito):**
- ✅ Até 1.000 contatos
- ✅ Automações ilimitadas
- ❌ Sem suporte prioritário

### **Boas Práticas:**
1. **Não envie spam:** Respeite as regras do Instagram
2. **Responda rápido:** Mesmo com automação, responda dúvidas manualmente
3. **Teste antes:** Sempre teste com sua própria conta primeiro
4. **Monitore diariamente:** Verifique se o ManyChat está funcionando

---

## 🆘 Troubleshooting (Problemas Comuns)

### **"ManyChat não está enviando DMs"**
- ✅ Verifique se o Instagram está conectado
- ✅ Confirme que o Flow está publicado (não em rascunho)
- ✅ Teste com uma conta diferente (não a sua)

### **"As pessoas não estão recebendo a DM"**
- ✅ Elas precisam seguir sua conta OU ter interagido antes
- ✅ Instagram bloqueia DMs para contas muito novas
- ✅ Verifique se a keyword está correta (case-sensitive)

### **"O link não está funcionando"**
- ✅ Verifique se copiou o link completo (com `?campaign=`)
- ✅ Teste o link em uma aba anônima do navegador
- ✅ Confirme que a campanha está ativa no Dashboard

---

## 📈 Resultados Esperados

Com essa estratégia, você pode esperar:

| Métrica | Valor Típico |
|---------|--------------|
| **Taxa de Comentário** | 5-15% dos seguidores |
| **Taxa de Clique no Link** | 60-80% dos que receberam DM |
| **Conversão para Cadastro** | 40-60% dos que clicaram |
| **Conversão para Pagante** | 8-12% após trial |

**Exemplo prático:**
- 1.000 seguidores veem o post
- 100 comentam "EU QUERO"
- 75 clicam no link
- 45 se cadastram
- 5 viram pagantes (R$ 29,90/mês = R$ 149,50/mês recorrente)

---

## 🎓 Recursos Adicionais

- **ManyChat Academy:** [https://academy.manychat.com](https://academy.manychat.com)
- **Suporte ManyChat:** [https://help.manychat.com](https://help.manychat.com)
- **Vídeos Tutorial:** Busque "ManyChat Instagram automation" no YouTube

---

## ✅ Checklist Final

Antes de lançar sua campanha, confirme:

- [ ] ManyChat conectado ao Instagram Business
- [ ] Flow criado e publicado
- [ ] Keyword configurada corretamente
- [ ] Link da campanha colado na mensagem
- [ ] Testado com sua própria conta
- [ ] Post do Instagram pronto para publicar
- [ ] Dashboard do HoraMed aberto para monitorar

---

**Pronto! Agora você tem um sistema de aquisição automatizado e escalável. 🚀**

Qualquer dúvida, consulte este guia ou entre em contato com o suporte.
