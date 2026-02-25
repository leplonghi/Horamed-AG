# 🧪 TESTE MANUAL DO CAMPAIGN GENERATOR

## ✅ STATUS: PRONTO PARA TESTE

---

## 📋 PRÉ-REQUISITOS

1. ✅ Servidor rodando: `npm run dev` (porta 8080)
2. ✅ Você é admin (email: leplonghi@gmail.com)
3. ✅ Firebase configurado e conectado
4. ✅ Navegador aberto

---

## 🎯 TESTE 1: ACESSO AO GENERATOR

### Passos:
1. Abra: `http://localhost:8080/internal/campaign-generator`
2. Aguarde o carregamento

### Verificações:
- [ ] Página carrega sem erros
- [ ] Título "HoraMarket Brain" está visível
- [ ] Subtítulo "Gerador Inteligente de Campanhas de Aquisição"
- [ ] Badge mostra "X Campanhas Ativas"
- [ ] 3 tabs visíveis: ⚙️ Configurar | ✨ Criativos | 📊 Monitor

---

## 🎯 TESTE 2: EMBAIXADOR VIP (WhatsApp Groups)

### Passos:
1. Tab "Configurar" ativa
2. Selecione: **💎 Embaixador VIP**
3. Verifique descrição: "Grupos VIP de WhatsApp"
4. Verifique: "30 vagas • 90 dias"
5. Selecione Tom: **🔥 Urgência / FOMO**
6. Selecione Estilo: **🎯 Marketing (Promoção)**
7. Selecione Grupo WhatsApp: **👨‍👩‍👧‍👦 Família / Amigos**
8. Clique: **"Gerar Campanha Completa"**

### Verificações:
- [ ] Botão muda para "Gerando..."
- [ ] Tab muda automaticamente para "✨ Criativos"
- [ ] Toast de sucesso: "Campanha criada! 🎉"

### Conteúdo Gerado:
- [ ] **📝 Texto Pronto** aparece
- [ ] Badge mostra "WhatsApp"
- [ ] Texto começa com: "Olá, pessoal! 👋"
- [ ] Menciona: "grupo muito especial"
- [ ] Mostra: "90 dias de Premium GRÁTIS"
- [ ] Link: `https://app.horamed.net/auth?campaign=VIP_XXXXXX`
- [ ] Hashtags: #HoraMarket #Saude #OrganizacaoSaude #Familia #Cuidado
- [ ] Botão "Copiar" funciona

- [ ] **🎨 Prompt para Imagem** aparece
- [ ] Menciona "HoraMarket app interface"
- [ ] Menciona "ocean blue gradient"
- [ ] Compatível com: ChatGPT DALL-E 3, NanoBananaPro, Midjourney
- [ ] Botão "Copiar" funciona

- [ ] **🎬 Prompts para Vídeo (Veo 3.1)** aparecem
- [ ] Frame 1 descrito
- [ ] Frame 2 descrito
- [ ] Script Veo descrito
- [ ] Todos têm botão "Copiar"

- [ ] **💡 Dicas Estratégicas** aparecem
- [ ] 3 dicas listadas
- [ ] Primeira dica: "Envie em grupos VIP de WhatsApp"

---

## 🎯 TESTE 3: GRUPOS WHATSAPP - INSTITUTIONAL

### Passos:
1. Volte para tab "⚙️ Configurar"
2. Selecione: **📱 Grupos WhatsApp**
3. Selecione Grupo: **🏢 Institucionais / Corporativos**
4. Selecione Tom: **🎓 Educativo / Autoridade**
5. Selecione Estilo: **📰 Informativo (Novidades)**
6. Clique: **"Gerar Campanha Completa"**

### Verificações:
- [ ] Texto começa com: "Prezados, 🏢"
- [ ] Menciona: "solução digital para gestão de saúde"
- [ ] Mostra: "🏢 Benefícios institucionais"
- [ ] Menciona: "Relatórios exportáveis para RH"
- [ ] Menciona: "Redução de absenteísmo"
- [ ] Link: `https://app.horamed.net/auth?campaign=WPP_XXXXXX`
- [ ] 200 vagas (não 30)

---

## 🎯 TESTE 4: GRUPOS WHATSAPP - INDIVIDUAL

### Passos:
1. Volte para tab "⚙️ Configurar"
2. Selecione: **📱 Grupos WhatsApp**
3. Selecione Grupo: **👤 Individuais / Pessoais**
4. Selecione Tom: **💙 Emocional / História**
5. Selecione Estilo: **💡 Educativo (Dicas)**
6. Clique: **"Gerar Campanha Completa"**

### Verificações:
- [ ] Texto começa com: "Olá! 👤"
- [ ] Menciona: "Descobri um app que pode te ajudar"
- [ ] Mostra: "💊 Principais recursos"
- [ ] Menciona: "Lembretes de medicamentos"
- [ ] Menciona: "Controle de estoque de remédios"
- [ ] Link: `https://app.horamed.net/auth?campaign=WPP_XXXXXX`

---

## 🎯 TESTE 5: FLASH SEMANAL (Instagram)

### Passos:
1. Volte para tab "⚙️ Configurar"
2. Selecione: **⚡ Flash Semanal**
3. Verifique que aparece seletor de **Plataforma**
4. Selecione Plataforma: **Instagram**
5. Selecione Tom: **🔥 Urgência / FOMO**
6. Selecione Estilo: **🎯 Marketing (Promoção)**
7. Clique: **"Gerar Campanha Completa"**

### Verificações:
- [ ] Texto começa com: "🚨 ÚLTIMA CHAMADA! 🚨"
- [ ] Menciona: "50 VAGAS"
- [ ] Menciona: "14 dias de Premium"
- [ ] Menciona: "Já foram 23 em 2 horas!"
- [ ] Link: `https://app.horamed.net/auth?campaign=FLASH_XXXXXX`
- [ ] Badge mostra "Instagram"
- [ ] Hashtags incluem #Instagram

---

## 🎯 TESTE 6: KEYWORD DM (Instagram)

### Passos:
1. Volte para tab "⚙️ Configurar"
2. Selecione: **💬 Keyword DM**
3. Verifique que plataforma é **Instagram** (fixo)
4. Selecione Tom: **😄 Humor / Relatable**
5. Selecione Estilo: **🎯 Marketing (Promoção)**
6. Clique: **"Gerar Campanha Completa"**

### Verificações:
- [ ] Texto menciona: "EU QUERO"
- [ ] Menciona: "primeiras 100 pessoas"
- [ ] Menciona: "link EXCLUSIVO na DM"
- [ ] Link: `https://app.horamed.net/auth?campaign=KEY_XXXXXX`
- [ ] Dicas mencionam ManyChat

---

## 🎯 TESTE 7: DASHBOARD / MONITOR

### Passos:
1. Clique na tab **📊 Monitor**
2. Aguarde o carregamento

### Verificações:
- [ ] Título: "Campanhas Ativas"
- [ ] Mostra todas as campanhas criadas nos testes anteriores
- [ ] Cada campanha mostra:
  - [ ] Badge com código (ex: VIP_123456)
  - [ ] Descrição
  - [ ] Contador: X/Y (ex: 0/30)
  - [ ] "X restantes"
  - [ ] Barra de progresso (vazia se 0 resgates)
  - [ ] Botão "Copiar Link de Produção"

### Teste de Cópia:
- [ ] Clique em "Copiar Link de Produção"
- [ ] Toast: "Link copiado!"
- [ ] Cole em um editor de texto
- [ ] Verifique formato: `https://app.horamed.net/auth?campaign=XXX_XXXXXX`

---

## 🎯 TESTE 8: CORES E DESIGN

### Verificações Visuais:
- [ ] Gradiente Ocean (azul → cyan) visível no header
- [ ] Botão "Gerar Campanha" tem gradiente fluido
- [ ] Cards têm efeito glassmorphism
- [ ] Tabs mudam de cor quando ativas (gradiente fluido)
- [ ] Badges coloridos:
  - [ ] Verde se >10 vagas restantes
  - [ ] Vermelho se ≤10 vagas restantes
- [ ] Animações suaves ao trocar de tab
- [ ] Hover effects nos cards de estratégia

---

## 🎯 TESTE 9: RESPONSIVIDADE

### Desktop (>1024px):
- [ ] Layout em 2 colunas quando apropriado
- [ ] Cards lado a lado
- [ ] Texto legível

### Tablet (768px - 1024px):
- [ ] Layout ajusta para 1 coluna
- [ ] Botões mantêm tamanho adequado

### Mobile (<768px):
- [ ] Tudo em 1 coluna
- [ ] Botões ocupam largura total
- [ ] Texto não quebra de forma estranha

---

## 🐛 PROBLEMAS CONHECIDOS (CORRIGIDOS)

✅ **CORRIGIDO:** Textos faltando para institutional_corporate
✅ **CORRIGIDO:** Textos faltando para individual_personal
✅ **CORRIGIDO:** Dashboard vazio
✅ **CORRIGIDO:** Links apontando para localhost
✅ **CORRIGIDO:** Embaixador descrito como "mensagens individuais"

---

## ❌ SE ALGO NÃO FUNCIONAR

### Dashboard Vazio:
1. Abra Console do Navegador (F12)
2. Vá para tab "Console"
3. Procure por erros vermelhos
4. Verifique se Firebase está conectado
5. Verifique se você é admin

### Texto Não Gera:
1. Verifique se selecionou um tipo de grupo (para WhatsApp)
2. Abra Console e procure erros
3. Verifique se todos os campos estão preenchidos

### Link Errado:
1. Se aparecer `localhost:8080`, reporte o bug
2. Deve sempre ser `https://app.horamed.net`

---

## ✅ RESULTADO ESPERADO

Após todos os testes:

- ✅ 6 campanhas criadas (1 de cada tipo)
- ✅ Todas aparecem no Dashboard
- ✅ Todos os textos gerados corretamente
- ✅ Todos os links de produção corretos
- ✅ Todas as dicas estratégicas relevantes
- ✅ UI/UX fluida e responsiva
- ✅ Cores Ocean theme aplicadas

---

## 📊 CHECKLIST FINAL

- [ ] Embaixador VIP funciona
- [ ] Flash Semanal funciona
- [ ] Keyword DM funciona
- [ ] Grupos WhatsApp (4 tipos) funcionam
- [ ] Dashboard mostra campanhas
- [ ] Links de produção corretos
- [ ] Botões copiar funcionam
- [ ] Cores e design corretos
- [ ] Responsivo em mobile
- [ ] Sem erros no console

---

**🎉 SE TODOS OS TESTES PASSAREM: SISTEMA 100% FUNCIONAL!**
