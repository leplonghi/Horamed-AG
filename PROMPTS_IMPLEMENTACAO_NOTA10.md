# HoraMed — 5 Prompts para Nota 10
> Gerado em Abril de 2026 · Ordem de execução obrigatória

---

## ⚠️ REGRA DE OURO
Execute um prompt por vez. Só avance para o próximo quando o anterior estiver 100% concluído,
os builds passando e o app rodando sem erros no Android/Web.

---

## PROMPT 1 — SEGURANÇA E ESTABILIDADE CRÍTICA
**Tempo estimado:** 1-2 dias
**Impacto:** Elimina riscos legais, financeiros e de crash em produção

```
Você é um engenheiro de segurança e estabilidade sênior trabalhando no HoraMed,
um app React 18 + TypeScript + Firebase + Capacitor para lembretes de medicamentos.

Execute as seguintes tarefas em ordem, uma de cada vez, confirmando cada uma antes de avançar:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 1 — AUDITORIA DAS CHAVES STRIPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Leia o arquivo SEGURANCA_STRIPE_URGENTE.md e ACAO_IMEDIATA_STRIPE.md.
2. Verifique se o arquivo .env contém as chaves NOVAS (pós-rotação) ou as antigas expostas.
   - As chaves antigas eram as descritas no incidente documentado.
   - As chaves novas devem ter sido geradas APÓS o incidente.
3. Verifique no firebase.json e functions/src/index.ts se há alguma referência hardcoded
   a chaves Stripe antigas (sk_live_ ou pk_live_).
4. Faça um grep recursivo em todo o projeto por "sk_live_" e "pk_live_" fora de .env e .gitignore.
5. Reporte o resultado: se encontrar chaves hardcoded, liste os arquivos e substitua por
   process.env.STRIPE_SECRET_KEY (backend) ou import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY (frontend).
6. Confirme que .env está no .gitignore.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 2 — FIREBASE SECURITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Leia firestore.rules e storage.rules. Verifique e corrija os seguintes pontos:

Para CADA coleção de dados sensíveis (medications, doses, cofre/documents, vitalSigns,
appointments, sideEffects, userProfiles), garanta que as regras sigam este padrão:

  allow read, write: if request.auth != null
    && (request.auth.uid == resource.data.userId
    || exists(/databases/$(database)/documents/caregivers/$(request.auth.uid)/patients/$(resource.data.userId)));

Para a coleção de compartilhamento público (/shared/:token):
  allow read: if resource.data.expiresAt > request.time
    && resource.data.active == true;
  allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;

Para storage.rules, garanta que apenas o dono do userId no path pode ler/escrever:
  allow read, write: if request.auth != null && request.auth.uid == userId;

Após editar, liste as coleções que tinham regras insuficientes e o que foi corrigido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 3 — PROTEGER OS ~25 COMPONENTES COM new Date() INSEGURO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O projeto já tem src/lib/safeDateUtils.ts com safeDateParse() e safeGetTime().
O CODING_STANDARDS.md proíbe o uso direto de new Date() em dados externos.

1. Faça um grep recursivo em src/ por: new Date(dose, new Date(item, new Date(user,
   new Date(doc, new Date(med, new Date(vital, new Date(appoint, new Date(prop
   (qualquer new Date() que receba uma variável, não um literal como new Date())

2. Para cada ocorrência encontrada:
   - Substitua: const d = new Date(val)  →  const d = safeDateParse(val)
   - Adicione no topo do arquivo: import { safeDateParse } from "@/lib/safeDateUtils";
   - Se o arquivo já importa de @/types, use as funções específicas do tipo
     (safeParseDoseDate, safeParseProfileBirthDate) conforme documentado em src/types/

3. Após as substituições, rode: npm run build
   - Se houver erros de TypeScript, corrija-os.
   - O build deve completar sem erros.

4. Rode o lint: npm run lint
   - Reporte os warnings restantes.

5. Gere um relatório listando: quantos arquivos foram modificados e quais eram.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 4 — TOKENS DE COMPARTILHAMENTO SEGUROS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Encontre onde os tokens de compartilhamento de documentos são gerados
(busque por "token" em src/components/cofre/ e src/services/).

Verifique se os tokens:
a) São gerados com crypto.randomUUID() ou similar (não Math.random(), não sequencial).
b) São armazenados com um campo expiresAt (ex: Timestamp.fromDate(new Date(Date.now() + 86400000))
   para 24 horas).
c) São verificados no server-side (Firebase Rules) antes de retornar dados.

Se algum item não estiver implementado, implemente-o agora.
Crie ou atualize o serviço de compartilhamento para garantir esses três pontos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: rode npm run build. O output deve ser "build completed" sem erros.
Documente tudo que foi alterado em um arquivo SECURITY_FIXES_DONE.md.
```

---

## PROMPT 2 — SIMPLIFICAÇÃO RADICAL DE PRODUTO
**Tempo estimado:** 2-3 dias
**Impacto:** Elimina confusão do usuário, unifica flows críticos, reduz carga cognitiva

```
Você é um product engineer sênior com obsessão por simplicidade trabalhando no HoraMed.
Sua missão é simplificar sem remover valor real — podar, fundir e clarificar.

Execute cada bloco em ordem. Faça um commit após cada bloco.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — FUNDIR 3 TELAS DE GAMIFICAÇÃO EM 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Atualmente existem 3 rotas separadas para gamificação:
- /progresso → src/pages/Progress.tsx (análise de adesão)
- /conquistas → src/pages/Achievements.tsx (badges e conquistas)
- /jornada → src/pages/Gamification.tsx (XP e níveis)

O usuário não sabe qual rota tem sua streak. Fusão necessária:

1. Crie src/pages/MeuProgresso.tsx como a nova tela unificada.
   Estruture com 3 tabs usando o componente Tabs do shadcn/ui:
   - Tab "Hoje" → conteúdo atual de Progress.tsx (hero com streak, adesão do dia)
   - Tab "Conquistas" → conteúdo atual de Achievements.tsx
   - Tab "Jornada" → conteúdo atual de Gamification.tsx (XP, nível, desafios)

2. A rota principal será /meu-progresso. As rotas antigas /progresso, /conquistas e /jornada
   devem redirecionar para /meu-progresso (use <Navigate to="/meu-progresso" replace />).

3. No arquivo de navegação (src/components/Navigation.tsx), atualize o item de progresso
   para apontar para /meu-progresso com o label "Progresso" e ícone TrendingUp.

4. Mantenha toda a lógica e componentes existentes dentro das tabs — não refatore a lógica,
   apenas mova o JSX para dentro das tabs correspondentes.

5. Teste navegando para /progresso, /conquistas e /jornada — todos devem redirecionar
   para /meu-progresso abrindo na tab correta (passe o tab como ?tab=conquistas etc).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — UNIFICAR O FLOW DE ADICIONAR MEDICAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Existem 4 componentes/páginas para adicionar medicamento:
- src/pages/AddItem.tsx
- src/pages/AddItemRedirect.tsx
- src/pages/AddItemWizard.tsx
- src/pages/AddMedicationWizard.tsx
- src/components/medication-wizard/ (10 steps)

Regra: máximo 5 steps no wizard mobile. Faça o seguinte:

1. Defina o wizard canônico como src/components/medication-wizard/MedicationWizard.tsx.

2. Reduza os steps para no máximo 5, fusionando os que fazem sentido:
   - Step 1: IDENTIDADE — Nome + Categoria (une StepName + StepCategory)
   - Step 2: HORÁRIOS — Frequência + Horários (une StepFrequency + StepTimes)
   - Step 3: DETALHES — Dose, contínuo ou por período (une StepDetails + StepContinuous)
   - Step 4: ESTOQUE — Quantidade atual e alerta de reposição (StepStock)
   - Step 5: REVISÃO — Resumo de tudo antes de salvar (novo: ReviewStep)

3. Crie o ReviewStep.tsx dentro de medication-wizard/ que exibe um resumo
   editável de todos os dados inseridos antes do submit.

4. AddItemRedirect.tsx deve redirecionar diretamente para /adicionar (que usa o wizard canônico).
   AddItemWizard.tsx e AddMedicationWizard.tsx devem ser removidos se não tiverem
   lógica única — verifique antes se têm algo que o wizard canônico não tem.

5. A rota /adicionar deve apontar para uma única página que renderiza o MedicationWizard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — REMOVER 1 FAB E DEFINIR HIERARQUIA DE AÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Atualmente há dois botões flutuantes simultâneos:
- src/components/HealthAIButton.tsx (Clara)
- src/components/FloatingAddButton.tsx (Adicionar medicamento)

Regra do Material Design: máximo 1 FAB por tela.

Decisão de produto: O FAB principal é a Clara (diferencial do app).
O botão de adicionar vai para o header da tela /hoje e /rotina.

1. Em src/components/Navigation.tsx ou AppShell, remova o FloatingAddButton.
   Mantenha apenas o HealthAIButton como FAB global.

2. Nas páginas onde faz sentido adicionar (src/pages/TodayRedesign.tsx e
   src/pages/MedicamentosHub.tsx), adicione um botão "+" no header direito
   usando o componente PageHeroHeader (já existe no projeto) ou um IconButton simples.

3. O botão de adicionar no header deve navegar para /adicionar (o wizard unificado do Bloco 2).

4. Verifique se FloatingActionHub.tsx está sendo usado — se sim, avalie se pode ser
   substituído pelo HealthAIButton simplificado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 4 — AUMENTAR LIMITE FREE PARA 5 MEDICAMENTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O limite de 2 medicamentos no free impede a criação de hábito.

1. Busque em src/ todos os locais onde o limite de medicamentos free é definido
   (busque por: "limit", "maxMedications", "freeLimit", "FREE_LIMIT", "isPremium").

2. Onde encontrar o valor "2" ou "2 medicamentos" como limite, atualize para 5.

3. Atualize os textos de FOMO em src/components/fomo/ para refletir o novo limite:
   - UsageLimitWarning: "Você usa 5 de 5 slots gratuitos"
   - PremiumTeaser: "Quer medicamentos ilimitados? Conheça o Premium"

4. Atualize a página src/pages/Plans.tsx e qualquer banner de upgrade que mencione
   o limite, para mostrar "5 medicamentos gratuitos" como o tier free.

5. Atualize os documentos de produto se houver referência ao limite no código
   (ex: constantes em src/lib/ ou src/config/).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: rode npm run build. Navegue pelas 4 mudanças manualmente.
Gere um commit message descritivo para cada bloco implementado.
```

---

## PROMPT 3 — DESIGN SYSTEM E PERFORMANCE VISUAL
**Tempo estimado:** 2-3 dias
**Impacto:** Consistência visual total, performance em Android de entrada, acessibilidade

```
Você é um design engineer sênior trabalhando no HoraMed.
Sua missão é criar consistência visual e eliminar problemas de performance de CSS.

Execute cada bloco em ordem, testando no browser após cada um.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — LIMPAR E CONSOLIDAR O CSS GLOBAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Abra src/App.css. Remova TODO o conteúdo que veio do template Vite:
   - .logo, .logo:hover, @keyframes logo-spin, .card { padding: 2em }, .read-the-docs
   Mantenha apenas regras específicas do HoraMed. Se o arquivo ficar vazio, delete-o
   e remova o import no arquivo que o importa.

2. Abra src/index.css. Faça um audit:
   a) Liste os primeiros 20 gradientes (background: linear-gradient ou similar).
   b) Para cada gradiente que é puramente decorativo (não é o hero, não é um CTA principal,
      não serve a propósito funcional de hierarquia), substitua por uma cor sólida equivalente.
   c) Meta: reduzir de 83 para no máximo 15 gradientes no arquivo.
   d) Mantenha: OceanBackground gradients, hero sections, badges de status coloridos.
   e) Remova: cards decorativos com gradiente, bordas com gradiente, textos com gradiente
      que não são headlines principais.

3. Adicione fluid typography ao index.css ou tailwind.config.ts:
   Crie uma seção de tipografia com:
   --text-xs: clamp(0.7rem, 1.5vw, 0.75rem);
   --text-sm: clamp(0.8rem, 1.8vw, 0.875rem);
   --text-base: clamp(0.875rem, 2vw, 1rem);
   --text-lg: clamp(1rem, 2.5vw, 1.125rem);
   --text-xl: clamp(1.1rem, 3vw, 1.25rem);
   --text-2xl: clamp(1.25rem, 4vw, 1.5rem);
   --text-3xl: clamp(1.5rem, 5vw, 1.875rem);
   No tailwind.config.ts, adicione esses valores em theme.extend.fontSize.

4. Corrija os line-heights no index.css:
   Busque por line-height. Qualquer heading com line-height > 1.3 → reduza para 1.2.
   Adicione ao body ou ao root: line-height: 1.5;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — MIGRAR ANIMAÇÕES CARAS PARA TRANSFORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Animações de height, width, top, left, right, bottom, padding, margin disparam Layout+Paint
no browser. São 3-10x mais caras que transform+opacity.

1. No index.css e App.css, busque por todos os @keyframes e transitions que animam:
   height, width, max-height, max-width, top, left, right, bottom, padding, margin.

2. Para cada animação encontrada:
   - Se for um card que "expande" → substitua height animation por:
     transform: scaleY(0) → transform: scaleY(1), com transform-origin: top;
   - Se for um elemento que "desliza" → substitua top/left por:
     transform: translateY() ou translateX()
   - Se for um overlay que "aparece" → substitua display/height por:
     opacity: 0 → opacity: 1 com pointer-events: none quando invisible

3. No tailwind.config.ts, adicione animações customizadas seguras:
   animation: {
     'slide-up': 'slideUp 0.3s ease-out',
     'fade-in': 'fadeIn 0.2s ease-out',
     'scale-in': 'scaleIn 0.2s ease-out',
     'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
   }
   keyframes: {
     slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
     fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
     scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
     pulseSoft: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.02)' } },
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — CORRIGIR TARGETS PEQUENOS (< 44px)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A Lei de Fitts exige targets de no mínimo 44x44px em mobile.

1. No index.css, adicione uma regra global:
   button, a, [role="button"], [role="link"] {
     min-height: 44px;
     min-width: 44px;
   }

2. Caso essa regra quebre componentes que precisam ser menores visualmente (ex: ícones inline),
   use a técnica de padding invisível:
   .icon-button-sm {
     min-height: 44px;
     min-width: 44px;
     display: inline-flex;
     align-items: center;
     justify-content: center;
   }
   E adicione essa classe nos IconButtons pequenos do projeto.

3. Verifique especificamente:
   - src/components/DoseActionButton.tsx
   - src/components/Navigation.tsx (items do bottom nav)
   - src/components/FloatingActionButton.tsx
   - src/components/medications/MedicationQuickActions.tsx
   Em cada um, garanta que o elemento interativo tenha min-h-[44px] min-w-[44px].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 4 — CRIAR CARDBASE.TSX COMO COMPONENTE UNIFICADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Existem múltiplos estilos de card no projeto com rounding, shadow e border inconsistentes.

1. Crie src/components/ui/CardBase.tsx com as seguintes variantes:
   type CardVariant = 'default' | 'glass' | 'elevated' | 'flat' | 'colored';

   - default: bg-white rounded-2xl shadow-sm border border-gray-100
   - glass: bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50
   - elevated: bg-white rounded-2xl shadow-lg
   - flat: bg-gray-50 rounded-2xl border border-gray-100
   - colored: aceita uma prop colorClass para bg personalizado, rounded-2xl

   O componente deve aceitar: variant, className, children, onClick, e props padrão de div.

2. Exporte CardBase e documente as variantes no arquivo.

3. NÃO substitua todos os cards agora (escopo grande demais). Apenas:
   - Substitua o card de DoseCard.tsx para usar CardBase variant="default"
   - Substitua o card de AchievementCard.tsx para usar CardBase variant="elevated"
   - Documente nos comentários do CardBase quais outros componentes devem migrar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: rode npm run build. Abra o app em mobile emulator.
Verifique visualmente: consistência de cards, targets clicáveis, ausência de jank
em animações. Documente as alterações feitas.
```

---

## PROMPT 4 — CORE LOOP: MARCAR DOSE E FEEDBACK IMEDIATO
**Tempo estimado:** 1-2 dias
**Impacto:** A ação mais importante do app se torna perfeita — direto na conversão e retenção

```
Você é um UX engineer sênior trabalhando no HoraMed.
O core loop do app é: Abrir → Ver dose → Marcar como tomada → Sentir satisfação.
Sua missão é tornar esse loop perfeito: 1 tap, feedback imediato, celebração proporcional.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — SIMPLIFICAR A AÇÃO DE MARCAR DOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Atualmente existem: DoseActionButton.tsx, DoseActionModal.tsx e DoseStatusDialog.tsx
para uma única ação: marcar dose como tomada.

Regra: a ação de marcar dose deve ser possível em 1 tap na tela principal.

1. Leia DoseCard.tsx. Identifique o botão principal de ação.
2. O botão "Tomei" deve executar imediatamente (sem modal de confirmação) quando:
   - A dose está com status "pending" ou "scheduled"
   - O horário está próximo (± 2 horas do horário programado)
3. O modal de confirmação (DoseActionModal) só deve aparecer quando:
   - O usuário quer marcar como "ignorada" ou "atrasada"
   - O horário já passou há mais de 2 horas (dose potencialmente perdida)
4. Implemente optimistic update: ao tocar em "Tomei", o card deve imediatamente
   mostrar o estado "tomada" na UI (cor verde, ícone de check) ANTES da resposta
   do Firebase. Se o Firebase falhar, reverta com uma mensagem discreta de erro.
5. Adicione um handler de long press no DoseCard: se o usuário segurar o botão por 500ms,
   abra o DoseActionModal para ações avançadas (ignorar, registrar hora diferente, etc.).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — FEEDBACK PROPORCIONAL AO STREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O app já tem: MicroCelebration.tsx, ConfettiExplosion.tsx, StreakAnimation.tsx,
DailyCompleteModal.tsx. O problema é que esses componentes não são disparados
contextualmente no momento de marcar dose.

1. Após o optimistic update do Bloco 1 ser confirmado pelo Firebase, dispare:

   Lógica de celebração proporcional ao streak atual do usuário:
   - streak === 1 (primeiro dia): MicroCelebration simples com mensagem "Boa! Primeiro dia!"
   - streak >= 3 && streak < 7: MicroCelebration + badge de "X dias seguidos"
   - streak >= 7 && streak < 30: StreakAnimation com o número do streak
   - streak >= 30: ConfettiExplosion + StreakAnimation + mensagem especial da Clara
   - Se todas as doses do dia foram tomadas: DailyCompleteModal

2. A celebração deve aparecer na própria tela /hoje, não redirecionar para outra tela.
3. Use React state local para controlar a exibição: após 2.5s a celebração some automaticamente
   sem necessidade de o usuário fechar.
4. Para obter o streak atual, use o hook que já existe no projeto (busque por useStreak ou
   similar em src/hooks/). Se não existir, acesse o campo streak do documento do usuário
   no Firestore via useUserStats ou similar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — HERO DE PRÓXIMA DOSE NA TELA HOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O componente HeroNextDose.tsx existe mas precisa ser o ponto focal da tela /hoje.

1. Leia src/pages/TodayRedesign.tsx. Garanta que HeroNextDose é o PRIMEIRO componente
   renderizado após a saudação personalizada (antes de qualquer lista ou dashboard).

2. No HeroNextDose, o botão "Tomei" deve usar a lógica do Bloco 1 (1 tap, optimistic update).

3. Adicione um countdown timer no HeroNextDose para a próxima dose:
   - Se a próxima dose é em menos de 1h: "Em 45 minutos" (conta regressiva live)
   - Se é em mais de 1h: "Às 14:30" (horário fixo)
   - Se já passou: "Atrasada! Há 20 min" em vermelho/laranja

4. O HeroNextDose deve ter altura mínima de 180px e ser visualmente o card mais proeminente
   da tela — tamanho de fonte maior, shadow mais forte, cor de fundo distinta.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 4 — CLARA PROATIVA NO CONTEXTO CERTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A Clara tem ClaraProactiveCard.tsx e ClaraSuggestions.tsx mas aparecem de forma
inconsistente. Defina um ponto de entrada canônico:

1. A Clara proativa deve aparecer APENAS na tela /hoje, logo após a lista de doses,
   como um card de no máximo 2 linhas de texto + 1 CTA.

2. O ClaraProactiveCard deve ser contextual:
   - Se há dose atrasada: "Você tem uma dose de [nome] atrasada. Precisa de ajuda?"
   - Se streak está em risco (mais de 20h sem marcar): "Não esqueça seu [nome] hoje!"
   - Se acabou de completar todas as doses do dia: "Parabéns! Todos os remédios tomados hoje."
   - Default (sem contexto específico): uma dica de saúde aleatória do banco de insights

3. O botão flutuante (HealthAIButton) continua como ponto de entrada para o chat completo.
   O ClaraProactiveCard é apenas para mensagens contextuais curtas — não abre chat,
   apenas mostra a mensagem e tem um botão "Falar com Clara" que abre o chat.

4. Remova ClaraProactiveCard de qualquer outra tela onde aparece (exceto /hoje).
   ContextualClara.tsx que aparece em outras telas deve mostrar apenas o HealthAIButton.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: Teste o core loop completo manualmente:
1. Abrir o app → ver HeroNextDose com countdown
2. Tocar em "Tomei" → ver optimistic update instantâneo
3. Ver celebração proporcional ao streak
4. Ver ClaraProactiveCard contextual logo abaixo
Documente o teste com prints ou descrição de cada passo.
```

---

## PROMPT 5 — QUALIDADE DE CÓDIGO E FINALIZAÇÃO DA MIGRAÇÃO
**Tempo estimado:** 2-3 dias
**Impacto:** Elimina a maior dívida técnica ativa, adiciona cobertura de testes em lógica crítica

```
Você é um engenheiro de plataforma sênior trabalhando no HoraMed.
Sua missão é eliminar dívidas técnicas estruturais e garantir que o codebase
está pronto para escala sem surpresas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — FINALIZAR MIGRAÇÃO SUPABASE → FIREBASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Leia MIGRATION_STATUS.md e CODE_MIGRATION_PROGRESS.md para entender o estado atual.

2. Faça um grep recursivo em src/ por:
   - "supabase"
   - "from '@supabase"
   - "createClient" (do supabase)
   - "SUPABASE_URL"
   - "SUPABASE_KEY"
   - "VITE_SUPABASE"

3. Para cada arquivo que ainda usa Supabase:
   a. Identifique qual coleção/tabela está sendo lida/escrita.
   b. Confirme se essa coleção já existe no Firestore (via Firebase Console ou
      listando as coleções nos arquivos de Firebase já migrados).
   c. Substitua a query Supabase pelo equivalente Firebase usando os padrões já
      estabelecidos no projeto (veja src/hooks/ que já usam Firebase para exemplos).
   d. Após a substituição, teste a funcionalidade correspondente.

4. Após migrar todos os usos, remova:
   - A dependência @supabase/supabase-js do package.json
   - Qualquer arquivo src/lib/supabase.ts ou similar
   - Variáveis de ambiente VITE_SUPABASE_* do .env (após confirmar que não são mais usadas)

5. Rode npm install && npm run build. O build deve completar sem imports quebrados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — TESTES UNITÁRIOS PARA LÓGICA CRÍTICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O projeto tem Vitest configurado (vitest.config.ts). Adicione testes para:

TESTE 1: src/lib/safeDateUtils.ts
  - Deve retornar Date válida para string ISO
  - Deve retornar Date válida para Firestore Timestamp
  - Deve retornar fallback (new Date()) para string inválida
  - Deve retornar fallback para null/undefined
  - Deve retornar fallback para objeto vazio {}

TESTE 2: src/types/dose.ts (calculateDoseStats)
  - Deve calcular corretamente para array vazio
  - Deve contar doses taken, missed, skipped, pending corretamente
  - Deve calcular taxa de adesão (taken / total excluindo pending)
  - Deve ignorar doses com status inválido

TESTE 3: useReferralSystem (ou o hook/service que implementa a lógica de indicação)
  - Deve calcular desconto corretamente para 1 indicação Premium (-20%)
  - Deve calcular desconto corretamente para 3 indicações Premium (capped a algum % máximo)
  - Deve adicionar slot de medicamento para indicação Free
  - Deve retornar estado correto se código de indicação é inválido

TESTE 4: Lógica de streak (onde quer que esteja implementada)
  - Streak de 0 → marca dose → streak vai para 1
  - Streak de 5 → pula um dia → streak deve resetar para 0 (ou manter conforme a regra)
  - Streak de 5 → marca dose no mesmo dia → streak permanece 5 (não duplica)

Crie os arquivos de teste em src/__tests__/ ou ao lado dos arquivos (*.test.ts).
Rode: npx vitest run. Todos os testes devem passar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — TOM DE VOZ CONSISTENTE NOS TEXTOS DO APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O manifesto define: "acolhedor, motivador, nunca robótico".
A Clara segue isso. O restante do app, não.

1. Busque em src/ todos os textos de:
   - Mensagens de erro (busque por "error", "Erro", "falhou", "failed")
   - Empty states (busque por "Nenhum", "Não há", "Empty", "No data")
   - Toast messages (busque por toast(), showToast(), ou similar)
   - Títulos de loading states (busque por "Carregando", "Loading")

2. Para cada mensagem encontrada, reescreva no tom HoraMed:
   ANTES: "Erro ao salvar medicamento"
   DEPOIS: "Ops! Não consegui salvar agora. Tenta de novo? 💊"

   ANTES: "Nenhum medicamento cadastrado"
   DEPOIS: "Tudo limpo por aqui! Adicione seu primeiro remédio para começar."

   ANTES: "Carregando..."
   DEPOIS: "Só um segundo... 🌊"

   ANTES: "Erro de conexão"
   DEPOIS: "Parece que você está sem internet. Suas informações estão salvas localmente."

3. Crie um arquivo src/lib/messages.ts com todas as mensagens centralizadas:
   export const MSG = {
     error: { save: "Ops! Não consegui salvar...", load: "Não consegui carregar seus dados..." },
     empty: { medications: "Adicione seu primeiro remédio para começar.", doses: "Nenhuma dose para hoje!" },
     success: { doseTaken: "Anotado! Continue assim 💪", saved: "Salvo com sucesso!" },
     loading: { default: "Só um segundo... 🌊" },
   } as const;

4. Substitua as mensagens hardcoded nas buscas do item 1 pelos valores de MSG.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 4 — PERFORMANCE MODE PARA ANDROID DE ENTRADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Devices Android de entrada (Motorola E-series, Samsung A15) têm 2-3GB de RAM
e GPUs modestas. Glassmorphism e múltiplos gradientes causam dropped frames.

1. Crie um hook src/hooks/useDeviceCapability.ts:
   - Detecte se o device é de baixa performance usando:
     navigator.hardwareConcurrency < 4 (menos de 4 cores)
     navigator.deviceMemory < 4 (menos de 4GB, se disponível)
     Preferência do usuário: prefers-reduced-motion media query
   - Retorne: { isLowPerformance: boolean, prefersReducedMotion: boolean }

2. No AppProviders.tsx ou em um Context dedicado, disponibilize esse estado globalmente.

3. No OceanBackground.tsx (se existir) e nos componentes que usam glassmorphism
   (backdrop-blur, bg-white/80, etc.), aplique condicionalmente:
   - Se isLowPerformance === true: use bg-white sem backdrop-blur, sem gradientes animados
   - Se false: mantenha o visual completo

4. Em todos os componentes com Framer Motion (motion.div, etc.):
   Use a prop animate condicionalmente:
   animate={prefersReducedMotion ? false : animationVariant}
   Isso respeita tanto a preferência do usuário quanto a capacidade do device.

5. Adicione no index.css:
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: rode npm run build && npx vitest run.
Build deve completar sem erros. Todos os testes devem passar.
Gere um arquivo TECHNICAL_DEBT_RESOLVED.md listando o que foi feito em cada bloco.
```

---

## CHECKLIST FINAL — COMO SABER QUE ESTÁ NOTA 10

Após executar os 5 prompts, valide:

### Segurança ✅
- [ ] Chaves Stripe novas confirmadas em produção
- [ ] Firebase Rules auditadas e corrigidas
- [ ] Tokens de compartilhamento com expiração e UUID seguro
- [ ] Nenhuma chave hardcoded no código-fonte

### Produto ✅
- [ ] Gamificação unificada em 1 tela com 3 tabs
- [ ] Wizard de medicamento com máximo 5 steps
- [ ] Apenas 1 FAB (Clara)
- [ ] Limite free de 5 medicamentos

### Design ✅
- [ ] < 15 gradientes no CSS
- [ ] Todas as animações usando transform/opacity
- [ ] Todos os targets ≥ 44px
- [ ] Fluid typography com clamp()
- [ ] CardBase.tsx como componente base

### Core Loop ✅
- [ ] Marcar dose em 1 tap com optimistic update
- [ ] Celebração proporcional ao streak imediata
- [ ] HeroNextDose com countdown como ponto focal
- [ ] Clara proativa apenas no Home com contexto real

### Engenharia ✅
- [ ] Zero referências ao Supabase no código
- [ ] ~25 componentes com new Date() protegidos
- [ ] Testes unitários para safeDateUtils, calculateDoseStats, referral, streak
- [ ] Tom de voz consistente via MSG centralizado
- [ ] prefers-reduced-motion respeitado globalmente
