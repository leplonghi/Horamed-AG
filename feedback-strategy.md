# 📋 ESTRATÉGIA DE FEEDBACK (Gamified Survey)

> **Objetivo**: Validar Product-Market Fit (PMF) e identificar bugs críticos em troca de retenção (Premium).
> **Formato**: Micro-inquérito de 5 toques (menos de 60s).

---

## ⏰ QUANDO APARECE? (Timing)

1.  **Gatilho Principal (Pop-up)**:
    *   Quando: **4º Dia** após a instalação (Abertura do App).
    *   Condição: Usuário já completou pelo menos 1 rotina/medicamento.
    *   Call-to-Action: "Missão Especial: Resgatar Premium".

2.  **Gatilho Secundário (Card)**:
    *   Quando: Do 1º ao 7º dia.
    *   Onde: Topo da tela "Hoje" ou "Rotina".
    *   Texto: "Faltam 3 dias para expirar sua recompensa. Responda p/ liberar."

---

## ⚡ AS PERGUNTAS (Flow Rápido)

*Nenhuma pergunta exige digitação obrigatória.*

### Q1. IMPACTO (Adesão)
**"O HoraMed te ajudou a lembrar dos remédios?"**
*   [🤩] Sim, não esqueço mais nada!
*   [🙂] Ajudou bastante.
*   [😐] Mais ou menos.
*   [🙁] Não ajudou.

### Q2. USABILIDADE (Onboarding)
**"Foi fácil cadastrar seus medicamentos?"**
*   [⚡] Super rápido.
*   [👌] Fácil.
*   [🤯] Achei complicado.

### Q3. VALOR (Killer Feature)
**"O que você mais gostou até agora?"**
*   [⏰] Alarmes/Lembretes
*   [📦] Controle de Estoque
*   [💊] Interação Medicamentosa
*   [🏆] Gamificação/Pontos
*   [🤖] IA (Clara)

### Q4. ESTABILIDADE (Bug Report)
**"O app travou ou deu erro com você?"**
*   [✅] Não, rodou liso.
*   [🐛] Sim, travou/fechou.
*   [🐢] Achei lento.

### Q5. RECOMENDAÇÃO (NPS)
**"Você recomendaria o HoraMed para um amigo?"**
*   [❤️] Com certeza!
*   [👍] Sim.
*   [👎] Não.

### 📝 EXTRA (Opcional)
**"Quer deixar uma sugestão para os desenvolvedores?"**
*   [ Campo de Texto Livre ]
*   *Placeholder: "Sinto falta de..."*

---

## 🎁 A RECOMPENSA (Instant Gratification)

*   Ao clicar em "Enviar":
    1.  Confetes na tela (Animação Lottie).
    2.  Toast: "Premium Ativado! 🎉".
    3.  Atualização imediata do status no Firebase (`subscriptionStatus: 'premium'`).
    4.  Tag no perfil: `feedback_completed: true`.

---

## 🔒 PRIVACIDADE (Anonimato)

*   As respostas são salvas em uma coleção `feedbacks` no Firestore.
*   **Não salvamos** o e-mail nem nome no documento de feedback público (para análise de dados).
*   Salvamos apenas um `userId_hash` para evitar duplicidade de recompensa, mas desvinculado dos dados demográficos na visualização.
