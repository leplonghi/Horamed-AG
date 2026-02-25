# 🚀 GUIA RÁPIDO DE TESTE - CAMPAIGN GENERATOR

## ✅ O NAVEGADOR ACABOU DE ABRIR!

Você deve estar vendo a página: `http://localhost:8080/internal/campaign-generator`

---

## 🧪 TESTE RÁPIDO (5 minutos)

### **TESTE 1: Grupos WhatsApp - Institutional** ⭐

1. ✅ Verifique se vê "HoraMarket Brain" no topo
2. ✅ Clique no card **📱 Grupos WhatsApp**
3. ✅ No seletor "Tipo de Grupo WhatsApp", escolha: **🏢 Institucionais / Corporativos**
4. ✅ Clique no botão azul: **"Gerar Campanha Completa"**
5. ✅ Aguarde a geração (deve mudar para tab "Criativos")

**O QUE VOCÊ DEVE VER:**

```
📝 Texto Pronto

Prezados, 🏢

Compartilho uma solução digital para gestão de saúde:

HoraMarket - Plataforma de Organização de Saúde

🏢 Benefícios institucionais:
✅ Gestão de medicamentos e consultas
✅ Relatórios exportáveis para RH
✅ Redução de absenteísmo
✅ Compliance com protocolos de saúde

🎁 200 acessos corporativos (30 dias):
https://app.horamed.net/auth?campaign=WPP_XXXXXX

Disponível para avaliação institucional.
```

**✅ SE VIU ISSO: FUNCIONOU!**

---

### **TESTE 2: Dashboard** 📊

1. ✅ Clique na tab **📊 Monitor**
2. ✅ Você deve ver a campanha que acabou de criar
3. ✅ Deve mostrar: **0/200** (vagas usadas/total)
4. ✅ Barra de progresso vazia (0%)
5. ✅ Botão "Copiar Link de Produção"

**✅ SE VIU ISSO: DASHBOARD FUNCIONOU!**

---

### **TESTE 3: Embaixador VIP** 💎

1. ✅ Volte para tab **⚙️ Configurar**
2. ✅ Clique no card **💎 Embaixador VIP**
3. ✅ Verifique descrição: "Grupos VIP de WhatsApp"
4. ✅ Verifique: "30 vagas • 90 dias"
5. ✅ Clique: **"Gerar Campanha Completa"**

**O QUE VOCÊ DEVE VER:**

```
Olá, pessoal! 👋

Vocês fazem parte de um grupo muito especial para mim,
e por isso liberei um acesso VIP exclusivo para o HoraMarket.

🎁 Benefícios para nosso grupo:
✅ 90 dias de Premium GRÁTIS
✅ Todas as funcionalidades desbloqueadas
✅ Suporte direto comigo
...
```

**✅ SE VIU ISSO: EMBAIXADOR FUNCIONOU!**

---

## ✅ CHECKLIST RÁPIDO

- [ ] Página abriu sem erros
- [ ] Título "HoraMarket Brain" visível
- [ ] 4 cards de estratégia visíveis
- [ ] Grupos WhatsApp gera texto completo
- [ ] Texto menciona "Prezados, 🏢" (institutional)
- [ ] Link é `https://app.horamed.net/auth?campaign=...`
- [ ] Dashboard mostra campanhas criadas
- [ ] Progress bar aparece
- [ ] Embaixador menciona "grupo muito especial"
- [ ] Cores azul/cyan (Ocean theme) visíveis

---

## 🐛 SE ALGO DEU ERRADO

### **Página não carregou:**
```bash
# Verifique se o servidor está rodando
# Deve estar na porta 8080
```

### **Erro no console:**
1. Pressione `F12`
2. Vá para tab "Console"
3. Copie o erro vermelho
4. Me envie

### **Texto não gerou:**
1. Verifique se selecionou um tipo de grupo
2. Abra Console (F12)
3. Procure erros

### **Dashboard vazio:**
1. Crie uma campanha primeiro
2. Recarregue a página (F5)
3. Verifique se você é admin

---

## 📸 TIRE SCREENSHOTS

Se possível, tire prints de:
1. ✅ Página inicial (tab Configurar)
2. ✅ Texto gerado (tab Criativos)
3. ✅ Dashboard (tab Monitor)

---

## ✅ RESULTADO ESPERADO

Após os 3 testes:

- ✅ 2 campanhas criadas (Institutional + Embaixador)
- ✅ Ambas aparecem no Dashboard
- ✅ Textos completos e corretos
- ✅ Links de produção (`app.horamed.net`)
- ✅ UI com cores Ocean (azul → cyan)
- ✅ Sem erros no console

---

**🎉 SE TUDO FUNCIONOU: SISTEMA 100% OPERACIONAL!**

**❌ SE ALGO FALHOU: Me envie o erro do console (F12)**
