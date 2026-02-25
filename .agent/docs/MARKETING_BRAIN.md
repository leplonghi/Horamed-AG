# 🚀 HoraMed Marketing Brain - Documentação Completa

## 📋 Visão Geral

O **Marketing Brain** é o sistema completo de aquisição de usuários do HoraMed, integrando:
- ✅ Geração automática de campanhas
- ✅ Links rastreáveis com limites inteligentes
- ✅ Prompts para criação de mídia (imagens e vídeos)
- ✅ Textos prontos para cada estratégia
- ✅ Dashboard de monitoramento em tempo real
- ✅ Integração com ManyChat para automação

---

## 🎯 Estratégias Disponíveis

### 1. **Embaixador VIP** 💎
**Objetivo:** Alta retenção e feedback qualitativo

| Parâmetro | Valor |
|-----------|-------|
| Vagas | 30 (fixo) |
| Benefício | 90 dias Premium |
| Feedback | Obrigatório (bloqueia após 7 dias) |
| Público | Família, amigos próximos, parceiros |

**Quando usar:**
- Lançamento inicial do app
- Teste de novas funcionalidades
- Validação de produto

**ROI Esperado:**
- Retenção: 80-90%
- Conversão para pago: 40-50%
- Feedback de qualidade: 90%+

---

### 2. **Flash Semanal** ⚡
**Objetivo:** FOMO máximo e aquisição rápida

| Parâmetro | Valor |
|-----------|-------|
| Vagas | 50 (fixo) |
| Benefício | 14 dias Premium |
| Feedback | Opcional |
| Público | Instagram, TikTok, Facebook Ads |

**Quando usar:**
- Toda semana (ou quando você decidir)
- Lançamento de features novas
- Picos de tráfego

**ROI Esperado:**
- Taxa de clique: 60-80%
- Conversão para cadastro: 40-60%
- Conversão para pago: 5-10%

**Por que 50 e não 500?**
- ✅ Cria urgência real ("Restam 5 vagas!")
- ✅ Permite relançar múltiplas vezes
- ✅ Controla custo de servidor
- ✅ Aumenta perceived value

---

### 3. **Keyword DM** 💬
**Objetivo:** Engajamento e crescimento de seguidores

| Parâmetro | Valor |
|-----------|-------|
| Vagas | 100 (fixo) |
| Benefício | 30 dias Premium |
| Feedback | Opcional |
| Público | Instagram + ManyChat |

**Quando usar:**
- Crescimento de Instagram
- Lançamento de campanhas virais
- Aumento de engajamento

**ROI Esperado:**
- Taxa de comentário: 5-15% dos seguidores
- Taxa de clique: 60-80%
- Conversão para pago: 8-12%

**Exemplo prático:**
```
1.000 seguidores veem o post
→ 100 comentam "EU QUERO"
→ 75 clicam no link
→ 45 se cadastram
→ 5 viram pagantes (R$ 149,50/mês recorrente)
```

---

### 4. **WhatsApp Groups** 📱
**Objetivo:** Penetração em comunidades segmentadas

| Parâmetro | Valor |
|-----------|-------|
| Vagas | 200 (fixo) |
| Benefício | 30 dias Premium |
| Feedback | Opcional |
| Público | Grupos de WhatsApp |

**Grupos de Alta Conversão:**
1. **Mães/Pais** (Organização familiar)
2. **Fitness/Academia** (Suplementos e rotinas)
3. **Idosos** (Via filhos/cuidadores)
4. **Profissionais de Saúde** (Uso profissional)

**ROI Esperado:**
- Taxa de clique: 30-50% (alta confiança)
- Conversão para cadastro: 60-80%
- Conversão para pago: 10-15%

---

## 🔧 Como Funciona (Backend)

### Fluxo de Criação de Campanha

```typescript
1. Você clica em "Lançar Campanha Flash"
   ↓
2. CampaignService.createCampaign() cria entrada no Firestore:
   {
     code: "FLASH_ABC123",
     maxRedemptions: 50,
     currentRedemptions: 0,
     benefitDays: 14,
     isActive: true
   }
   ↓
3. Link gerado: https://horamed.app/auth?campaign=FLASH_ABC123
   ↓
4. Textos, prompts e hashtags gerados automaticamente
```

### Fluxo de Uso do Link

```typescript
1. Usuário clica no link
   ↓
2. Auth.tsx captura ?campaign=FLASH_ABC123
   ↓
3. Usuário se cadastra
   ↓
4. CampaignService.applyCampaignToUser() executa:
   
   a) Verifica se campanha existe
   b) Verifica se está ativa
   c) Verifica se ainda tem vagas
   
   SE TIVER VAGAS:
   - Incrementa contador (currentRedemptions++)
   - Aplica benefício (14 dias Premium)
   - Retorna: "Parabéns! Você ganhou 14 dias de Premium! 🎉"
   
   SE NÃO TIVER VAGAS:
   - Aplica fallback (7 dias padrão)
   - Retorna: "Opa! As vagas VIP acabaram 😔 Mas liberamos um trial especial de 7 dias pra você!"
```

**Importante:** Mesmo se o limite for atingido, o usuário **NUNCA** vê erro. Ele sempre ganha algo (fallback de 7 dias).

---

## 🎨 Geração de Mídia

### Imagens (Midjourney / ChatGPT)

O sistema gera prompts prontos para colar em ferramentas de IA:

**Exemplo (Flash):**
```
Bold graphic design with countdown timer showing '50 SPOTS LEFT'. 
Vibrant gradient background (orange to pink). 
Modern sans-serif typography. Urgency aesthetic. 
Instagram story format 9:16.
```

**Como usar:**
1. Copie o prompt
2. Cole no ChatGPT ou Midjourney
3. Baixe a imagem gerada
4. Poste no Instagram/TikTok

---

### Vídeos (Veo 3.1 / Runway)

O sistema gera **3 prompts**:
1. **Imagem Inicial** (Frame 1)
2. **Imagem Final** (Frame 2)
3. **Script de Transição**

**Exemplo (Flash):**

**Frame 1:**
```
Text overlay '50 VAGAS' in bold neon letters against dark background
```

**Frame 2:**
```
Counter rapidly decreasing to '12 VAGAS' with alarm sound visualization
```

**Script:**
```
Kinetic typography animation. Numbers counting down fast (50→12). 
Add glitch effects and urgency sound waves. Red alert flashing borders. 
Duration: 7 seconds. Style: High-energy TikTok.
```

**Como usar:**
1. Gere a Imagem 1 no Midjourney
2. Gere a Imagem 2 no Midjourney
3. Cole as 2 imagens + script no Veo 3.1 ou Runway
4. Exporte o vídeo de 7 segundos
5. Poste no TikTok/Reels

---

## 📊 Dashboard de Monitoramento

### Métricas em Tempo Real

O dashboard mostra:

```
VIP_FAMILIA_JAN
🟢 Ativo | 12/30 Usados | Restam 18
[████████░░░░░░░░░░░░] 40%

FLASH_INSTA_01
🟡 Acabando | 45/50 Usados | Restam 5
[████████████████████] 90%

KEY_EUQUERO_02
🟢 Ativo | 23/100 Usados | Restam 77
[████░░░░░░░░░░░░░░░░] 23%
```

### Ações Disponíveis

- **Copiar Link:** Copia o URL completo da campanha
- **Ver Código:** Mostra o código único (ex: FLASH_ABC123)
- **Status:** Ativo / Esgotado

---

## 🤖 Integração com ManyChat

### Passo a Passo Completo

Veja o guia detalhado em: `.agent/docs/MANYCHAT_TUTORIAL.md`

**Resumo:**
1. Conecte ManyChat ao Instagram Business
2. Crie um Flow com trigger "Instagram Comment"
3. Configure keyword: "EU QUERO"
4. Cole o link gerado no Campaign Generator
5. Publique e teste

**Resultado:**
- Usuário comenta "EU QUERO"
- Recebe DM automática em 1 minuto
- Clica no link
- Ganha 30 dias de Premium

---

## 💰 Análise de Monetização

### Cenário 1: Lote Flash (50 vagas)

```
50 usuários ganham 14 dias
↓
Conversão de 5% = 2-3 pagantes
↓
R$ 29,90/mês × 3 = R$ 89,70/mês recorrente
↓
LTV (12 meses) = R$ 1.076,40
```

**Custo:**
- Servidor: ~R$ 0,50 por usuário/mês
- 50 usuários × 14 dias = R$ 23,33
- **ROI:** 4.600% (46x)

---

### Cenário 2: Keyword DM (100 vagas)

```
100 usuários ganham 30 dias
↓
Conversão de 10% = 10 pagantes
↓
R$ 29,90/mês × 10 = R$ 299,00/mês recorrente
↓
LTV (12 meses) = R$ 3.588,00
```

**Custo:**
- Servidor: R$ 50,00
- ManyChat: R$ 0 (plano gratuito)
- **ROI:** 7.176% (71x)

---

### Cenário 3: Embaixador VIP (30 vagas)

```
30 usuários ganham 90 dias
↓
Conversão de 40% = 12 pagantes
↓
R$ 29,90/mês × 12 = R$ 358,80/mês recorrente
↓
LTV (12 meses) = R$ 4.305,60
```

**Custo:**
- Servidor: R$ 75,00
- **ROI:** 5.740% (57x)

**Bônus:**
- Feedback de qualidade
- Embaixadores orgânicos
- Redução de churn

---

## 🛡️ Proteção e Segurança

### Limites Inteligentes

1. **Contador Transacional:**
   - Usa Firestore Transactions
   - Garante que não ultrapasse o limite
   - Mesmo com acessos simultâneos

2. **Fallback Automático:**
   - Se limite atingido → 7 dias padrão
   - Usuário nunca vê erro
   - Mantém conversão alta

3. **Desativação Automática:**
   - Quando `currentRedemptions >= maxRedemptions`
   - Link continua funcionando (com fallback)

---

## 📈 Boas Práticas

### Lançamento de Campanhas

1. **Flash Semanal:**
   - Toda segunda-feira às 19h
   - Cria FOMO ("Última chamada!")
   - Relança com novo código

2. **Keyword DM:**
   - Teste A/B de keywords
   - "EU QUERO" vs "LINK" vs "QUERO"
   - Monitore taxa de comentário

3. **WhatsApp Groups:**
   - Peça permissão ao admin
   - Seja útil, não spam
   - Responda dúvidas rapidamente

### Otimização de Conversão

1. **Textos:**
   - Use emojis (mas não exagere)
   - Crie urgência real
   - Mostre benefícios claros

2. **Imagens:**
   - Cores vibrantes (laranja, rosa, roxo)
   - Texto grande e legível
   - Call-to-action claro

3. **Vídeos:**
   - Primeiros 3 segundos são críticos
   - Use música trending
   - Adicione legendas

---

## 🔄 Fluxo Completo (Exemplo Real)

### Dia 1 (Segunda-feira, 19h)

1. Você abre `/internal/campaign-generator`
2. Clica em "Lançar Campanha Flash"
3. Sistema gera:
   - Link: `https://horamed.app/auth?campaign=FLASH_JAN31`
   - Texto pronto
   - Prompt de imagem
   - Prompt de vídeo

4. Você copia o texto e posta no Instagram Stories:
```
🚨 ÚLTIMA CHAMADA! 🚨

Liberamos apenas 50 VAGAS para o trial de 14 dias do HoraMed.

⏰ Já foram 23 em 2 horas.

Clica AGORA: [link]
```

5. Adiciona sticker de contagem regressiva (2 horas)

### Dia 1 (19h - 21h)

- 500 pessoas veem o Story
- 75 clicam no link
- 45 se cadastram
- Dashboard mostra: `FLASH_JAN31: 45/50 Usados`

### Dia 2 (Terça-feira)

- Mais 5 pessoas se cadastram
- Dashboard mostra: `FLASH_JAN31: 50/50 Usados` 🔴
- Você edita o Story: "✅ ESGOTADO! Próxima rodada sexta-feira"

### Dia 3-7 (Quarta a Domingo)

- 10 pessoas ainda clicam no link antigo
- Recebem fallback: "Vagas esgotadas! Mas liberamos 7 dias pra você"
- Nenhuma conversão perdida

### Dia 8 (Segunda seguinte)

- Você lança novo lote: `FLASH_FEV07`
- Ciclo recomeça

---

## 📞 Suporte e Troubleshooting

### Problema: "Link não está funcionando"

**Checklist:**
- [ ] Campanha está ativa no Dashboard?
- [ ] Link está completo? (com `?campaign=`)
- [ ] Testou em aba anônima?

### Problema: "Contador não está atualizando"

**Solução:**
- Recarregue a página do Dashboard
- Verifique conexão com Firebase
- Confirme que `currentRedemptions` está incrementando no Firestore

### Problema: "ManyChat não está enviando DMs"

**Checklist:**
- [ ] Instagram está em modo Business?
- [ ] Flow está publicado (não em rascunho)?
- [ ] Keyword está correta?
- [ ] Testou com conta diferente?

---

## 🎓 Recursos Adicionais

- **Tutorial ManyChat:** `.agent/docs/MANYCHAT_TUTORIAL.md`
- **Código Backend:** `src/services/CampaignService.ts`
- **Código Frontend:** `src/pages/internal/CampaignGenerator.tsx`
- **Integração Auth:** `src/pages/Auth.tsx`

---

## ✅ Checklist de Lançamento

Antes de lançar sua primeira campanha:

- [ ] Testou o fluxo completo (cadastro com link)
- [ ] Dashboard está mostrando campanhas ativas
- [ ] Textos estão personalizados
- [ ] Imagens foram geradas
- [ ] ManyChat está configurado (se aplicável)
- [ ] Monitoramento está ativo

---

**Pronto! Você tem um sistema de aquisição profissional e escalável. 🚀**

Qualquer dúvida, consulte esta documentação ou os arquivos de código.
