# HoraMed — Prompts Nota 10 (V2 — Baseado em Auditoria Real)
> Gerado em Abril 2026 · Cada prompt resolve itens confirmados como pendentes no código

**Regra:** execute um prompt por vez, rode `npm run build` ao final de cada um,
só avance quando o build passar sem erros.

---

## PROMPT 1 — SEGURANÇA: FIREBASE RULES COMPLETAS
**Resolve:** Firebase Rules para cuidadores + regra de compartilhamento público
**Arquivos:** `firestore.rules`, `storage.rules`
**Tempo estimado:** 2–4 horas

```
Você é um engenheiro de segurança trabalhando no HoraMed (React + Firebase).
Leia o arquivo firestore.rules na raiz do projeto.

As regras atuais protegem cada coleção com isOwner(userId) — isso está correto.
Mas faltam dois blocos críticos que precisam ser adicionados:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — REGRA DE CUIDADORES (CAREGIVERS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O app tem perfis familiares (Premium). Um cuidador autorizado precisa ler/escrever
dados de outro usuário (ex: marcar dose de um familiar). Sem essa regra, o app
silenciosamente falha para cuidadores em produção.

1. Adicione a função helper no topo das rules, junto com isOwner e isAuthenticated:

   function isCaregiverOf(patientUserId) {
     return isAuthenticated() &&
       exists(/databases/$(database)/documents/users/$(patientUserId)/caregivers/$(request.auth.uid));
   }

2. Para as subcoleções sensíveis que um cuidador precisa acessar, adicione a permissão
   de leitura para cuidadores autorizados. Aplique nas seguintes subcoleções dentro de
   match /users/{userId} { ... }:

   - medications/{medicationId}: adicione allow read: if isOwner(userId) || isCaregiverOf(userId);
   - doses/{doseId}: adicione allow read, write: if isOwner(userId) || isCaregiverOf(userId);
   - documents/{documentId}: adicione allow read: if isOwner(userId) || isCaregiverOf(userId);
   - vaccinations/{vaccinationId}: adicione allow read: if isOwner(userId) || isCaregiverOf(userId);

3. Adicione a subcoleção de caregivers dentro de match /users/{userId}:
   match /caregivers/{caregiverId} {
     // O dono pode gerenciar seus cuidadores
     allow read, write: if isOwner(userId);
     // O cuidador pode ler seu próprio registro (para saber que tem acesso)
     allow read: if isAuthenticated() && request.auth.uid == caregiverId;
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — REGRA DE COMPARTILHAMENTO PÚBLICO COM TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O app tem a rota /compartilhar/:token que permite acesso público a documentos.
Isso requer uma coleção de tokens de compartilhamento. Se ela não existir, crie-a.

Adicione FORA do match /users/{userId}, no nível raiz do Firestore:

   match /sharedDocuments/{tokenId} {
     // Leitura pública — mas apenas se o token estiver ativo e não expirado
     allow read: if resource.data.active == true
       && resource.data.expiresAt > request.time;

     // Apenas o dono do documento pode criar/revogar o link de compartilhamento
     allow create: if isAuthenticated()
       && request.auth.uid == request.resource.data.ownerId
       && request.resource.data.active == true
       && request.resource.data.expiresAt is timestamp;

     allow update: if isAuthenticated()
       && request.auth.uid == resource.data.ownerId;

     allow delete: if isAuthenticated()
       && request.auth.uid == resource.data.ownerId;
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — CRIAR shareDocumentService.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para que a coleção sharedDocuments seja usada corretamente, crie o arquivo
src/services/shareDocumentService.ts com as seguintes funções:

import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";

/**
 * Cria um link de compartilhamento público para um documento do Cofre.
 * O token expira em 24 horas por padrão.
 */
export async function createShareToken(
  ownerId: string,
  documentId: string,
  documentType: string,
  expiresInHours = 24
): Promise<string> {
  const tokenId = crypto.randomUUID();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
  );

  await setDoc(doc(db, "sharedDocuments", tokenId), {
    tokenId,
    ownerId,
    documentId,
    documentType,
    active: true,
    expiresAt,
    createdAt: serverTimestamp(),
  });

  return tokenId;
}

/**
 * Revoga um link de compartilhamento antes de expirar.
 */
export async function revokeShareToken(tokenId: string): Promise<void> {
  await deleteDoc(doc(db, "sharedDocuments", tokenId));
}

Depois, verifique se src/pages/CompartilharDocumento.tsx lê desta coleção.
Se ele lê de outro lugar (ex: Supabase ou path diferente), atualize para usar
a coleção sharedDocuments com a estrutura acima.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL:
- Revise as rules completas para garantir que não há allow read/write sem condição
- Execute: firebase deploy --only firestore:rules,storage
- Documente as mudanças em SECURITY_RULES_V2.md
```

---

## PROMPT 2 — PRODUTO: LIMITE FREE + LINKS DE GAMIFICAÇÃO
**Resolve:** `maxActive = 2` → 5 + GamificationHub/Widget apontando para rotas antigas
**Arquivos:** `src/hooks/useMedicationLimits.ts`, `src/components/gamification/GamificationHub.tsx`, `src/components/gamification/GamificationWidget.tsx`, `src/lib/microcopy.ts`
**Tempo estimado:** 1–2 horas

```
Você é um product engineer trabalhando no HoraMed. Execute as tarefas abaixo em ordem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 1 — AUMENTAR LIMITE FREE PARA 5 MEDICAMENTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abra src/hooks/useMedicationLimits.ts.

Linha ~17: atualize o comentário de "Max 2 active medications" para "Max 5 active medications".
Linha ~79: mude:
  ANTES: const maxActive = 2; // Free tier allows up to 2 medications
  DEPOIS: const maxActive = 5; // Free tier allows up to 5 medications

Ainda no mesmo arquivo, verifique se há outra ocorrência de "2" como limite e atualize.

Agora busque em todo o projeto (src/) por strings que mencionam "2 medicamentos",
"2 remédios", "up to 2", "máximo 2", "limit of 2" e atualize para 5.
Use: grep -rn "2 medic\|2 remé\|up to 2\|máximo 2\|limit.*2\b" src/ --include="*.ts" --include="*.tsx"

Em src/components/fomo/UsageLimitWarning.tsx, verifique o campo urgencyThreshold
(atualmente = 2) e atualize para 5.

Em src/hooks/useAILimits.ts, o limite de 2 requests/dia de IA para free é separado
do limite de medicamentos — NÃO altere esse arquivo (o limite de IA é intencional).

Em src/lib/microcopy.ts, localize qualquer texto que mencione "2 medicamentos"
ou "2 remédios" e atualize para 5.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 2 — CORRIGIR LINKS INTERNOS DE GAMIFICAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROBLEMA: Mesmo com MeuProgresso.tsx como tela unificada, componentes internos
ainda navegam para rotas antigas que agora são apenas redirects.

Abra src/components/gamification/GamificationHub.tsx:
- Linha 142: mude navigate("/conquistas") → navigate("/meu-progresso?tab=achievements")
- Linha 169: mude navigate("/conquistas") → navigate("/meu-progresso?tab=achievements")

Abra src/components/gamification/GamificationWidget.tsx:
- Linha 50: mude navigate("/jornada") → navigate("/meu-progresso")

Agora faça um grep geral por navegações para rotas antigas:
grep -rn '"/conquistas"\|"/jornada"\|"/progresso"' src/ --include="*.tsx" --include="*.ts"

Para CADA ocorrência encontrada fora de AppShell.tsx (que define os redirects):
- "/conquistas" → substitua por "/meu-progresso?tab=achievements"
- "/jornada" → substitua por "/meu-progresso"
- "/progresso" (sem /detalhes) → substitua por "/meu-progresso"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREFA 3 — AJUSTAR TABS DO MeuProgresso PARA REFLETIR GAMIFICAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abra src/pages/MeuProgresso.tsx.
Os tabs atuais são: "history" / "appointments" / "achievements"

O tab "appointments" está vazio (sem componente renderizado).
Substitua pelo conteúdo de Gamification.tsx (jornada XP):

1. Importe Gamification: import Gamification from "./Gamification";
2. Mude o label do TabsTrigger de "appointments" para algo como "Jornada"
   com ícone TrendingUp ou Flame (da lib phosphor-react já usada no projeto)
3. No TabsContent value="appointments", adicione: <Gamification hideLayout={true} />

Verifique se Gamification.tsx aceita a prop hideLayout. Se não aceitar,
adicione: interface GamificationProps { hideLayout?: boolean; }
e use essa prop para omitir o Header/Navigation quando hideLayout === true.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: rode npm run build. Zero erros de TypeScript.
Teste navegando para /meu-progresso e verificando os 3 tabs funcionando.
```

---

## PROMPT 3 — DESIGN: GRADIENTES, ANIMAÇÕES E TARGETS
**Resolve:** 94 gradientes → máx. 15 · 12 animações `height` → `transform` · `Navigation.tsx` targets
**Arquivos:** `src/index.css` + 12 componentes específicos + `src/components/Navigation.tsx`
**Tempo estimado:** 3–5 horas

```
Você é um design engineer focado em performance e consistência visual no HoraMed.
Execute os três blocos abaixo em ordem. Commit após cada bloco.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — REDUZIR GRADIENTES DE 94 PARA MÁXIMO 15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abra src/index.css. Há 94 ocorrências de gradient/linear-gradient/radial-gradient.

REGRA: manter apenas gradientes que servem a propósito funcional:
  MANTER: Ocean background principal, hero sections, botões CTA primários,
           badges de status coloridos, faixas de level/XP, card de streak,
           gradientes de avatar/ícone por categoria de medicamento.
  REMOVER: Gradientes decorativos em bordas, textos não-headlines, fundos de
            cards que poderiam ser solid color, overlays que são apenas estéticos.

Processo:
1. Faça uma busca de todos os gradientes:
   grep -n "gradient\|linear-gradient\|radial-gradient" src/index.css

2. Para cada gradiente encontrado, avalie: ele está num componente que o usuário
   VÊ como elemento principal ou é decoração de fundo secundário?

3. Para gradientes decorativos em cards e fundos de seção, substitua pela cor
   mais próxima do início do gradiente como solid color.
   Exemplo:
     ANTES: background: linear-gradient(135deg, #e0f2fe, #bfdbfe);
     DEPOIS: background: #e0f2fe;

4. Para gradientes em texto (background-clip: text), substitua pelo texto com
   a cor mais forte do gradiente:
     ANTES: background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text;
     DEPOIS: color: #3b82f6;

5. Meta: ao final, grep -c "gradient" src/index.css deve retornar ≤ 15.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — MIGRAR 12 ANIMAÇÕES DE height PARA overflow/opacity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Os seguintes 12 arquivos têm animate={{ height: "auto", opacity: 1 }} com Framer Motion.
Animações de height disparam Layout+Paint (3–10x mais caro que opacity/transform).

Arquivos a corrigir:
1. src/components/accessibility/ElderlyModeToggle.tsx
2. src/components/clara/ClaraWeeklySummary.tsx
3. src/components/DrugInteractionCard.tsx
4. src/components/health/DrugInteractionAlert.tsx
5. src/components/health/HealthMeasurementCard.tsx
6. src/components/medication-wizard/ConditionalWizardStep.tsx (2 ocorrências)
7. src/components/medication-wizard/ProgressiveWizard.tsx
8. src/components/notifications/NotificationScheduleEditor.tsx
9. src/components/providers/ProviderCard.tsx
10. src/components/shared/ActionFeedbackInline.tsx
11. src/pages/internal/CampaignGenerator.tsx

Para CADA arquivo, substitua o padrão de expand/collapse:

PADRÃO ATUAL (animação de height — RUIM):
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        {content}
      </motion.div>
    )}
  </AnimatePresence>

PADRÃO CORRETO (animação de opacity + transform — BOM):
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    )}
  </AnimatePresence>

ATENÇÃO: Se o conteúdo for colapsável (accordion, expandable card), use a
abordagem CSS com max-height + overflow:hidden APENAS se necessário para
layout, mas não anime max-height — use a classe Tailwind "hidden" controlada
por estado React + transição de opacity:

  <div className={cn(
    "overflow-hidden transition-all duration-200",
    isOpen ? "opacity-100" : "opacity-0 h-0 pointer-events-none"
  )}>
    {content}
  </div>

Aplique a correção mais adequada para cada contexto em cada arquivo.
Após cada arquivo, verifique se o comportamento visual ainda faz sentido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — APLICAR TARGETS 44px NOS ITENS DE NAVEGAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A regra global min-h-[44px] existe no index.css mas não está sendo aplicada
na Navigation.tsx. Abra src/components/Navigation.tsx.

1. Identifique os elementos clicáveis do bottom navigation (cada item/tab).
2. Garanta que cada item tem pelo menos h-14 (56px) ou min-h-[44px] para a
   área tocável. Se usar Link ou button, adicione a classe:
   className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ..."

3. Verifique também src/components/HealthAIButton.tsx — o FAB principal.
   Garanta que o botão tem pelo menos w-14 h-14 (56px) de área tocável.

4. Verifique src/components/DoseActionButton.tsx — botão mais usado do app.
   Garanta min-h-[44px] no elemento interativo.

5. Rode: grep -n "h-8\b\|h-9\b\|h-6\b" src/components/Navigation.tsx
   Para qualquer resultado encontrado, avalie se é um ícone decorativo (ok)
   ou o elemento clicável (precisa de min-h-[44px] no pai).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL:
- grep -c "gradient" src/index.css → deve ser ≤ 15
- grep -rn "animate.*height" src/ → deve retornar 0 resultados relevantes
- npm run build sem erros
```

---

## PROMPT 4 — CORE LOOP: COUNTDOWN, CELEBRAÇÃO E CLARA NO HOME
**Resolve:** Countdown no HeroNextDose · Celebração proporcional em TodayRedesign · Clara proativa em TodayRedesign
**Arquivos:** `src/components/HeroNextDose.tsx`, `src/pages/TodayRedesign.tsx`
**Tempo estimado:** 3–5 horas

```
Você é um UX engineer trabalhando no HoraMed. O core loop (abrir → ver dose →
marcar → sentir satisfação) está quase perfeito. Faltam 3 peças que transformam
o app de bom para memorável.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — COUNTDOWN REGRESSIVO NO HeroNextDose.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abra src/components/HeroNextDose.tsx.
Atualmente o componente mostra o horário da dose mas sem contagem regressiva.

Adicione um hook de countdown logo após os imports existentes:

1. Adicione um state e efeito de countdown:

  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!dose) return;

    const updateCountdown = () => {
      const dueDate = safeDateParse(dose.dueAt); // já existe no projeto
      if (!dueDate) return;

      const now = new Date();
      const diffMs = dueDate.getTime() - now.getTime();

      if (diffMs < 0) {
        // Dose atrasada
        const overMs = Math.abs(diffMs);
        const overMin = Math.floor(overMs / 60000);
        const overHrs = Math.floor(overMin / 60);
        if (overHrs > 0) {
          setTimeLeft(`Atrasada há ${overHrs}h${overMin % 60 > 0 ? ` ${overMin % 60}min` : ""}`);
        } else {
          setTimeLeft(`Atrasada há ${overMin}min`);
        }
      } else if (diffMs < 3600000) {
        // Menos de 1 hora — mostra contagem regressiva ao vivo
        const min = Math.floor(diffMs / 60000);
        const sec = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`Em ${min}:${String(sec).padStart(2, "0")}`);
      } else {
        // Mais de 1 hora — mostra horário fixo
        const hh = dueDate.getHours().toString().padStart(2, "0");
        const mm = dueDate.getMinutes().toString().padStart(2, "0");
        setTimeLeft(`Às ${hh}:${mm}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [dose]);

2. No JSX do componente, exiba o timeLeft com estilo adequado:
   - Se começa com "Atrasada": texto em laranja/vermelho, ícone de alerta
   - Se começa com "Em": texto em azul, ícone de relógio (Clock da phosphor-react)
   - Se começa com "Às": texto em cinza/muted

   Coloque logo abaixo do nome da dose, antes do botão "Tomei".

3. Garanta que quando dose é null (nenhuma dose pendente), o countdown
   não renderiza nada (condição já deve existir no componente).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — CELEBRAÇÃO PROPORCIONAL EM TodayRedesign.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abra src/pages/TodayRedesign.tsx.
Atualmente não há nenhuma celebração visual quando o usuário marca uma dose.
Nota: Today.tsx (versão antiga) tem isso — você vai TRANSPLANTAR a lógica.

1. Adicione os imports necessários no TodayRedesign.tsx:
   import MicroCelebration from "@/components/celebrations/MicroCelebration";
   import StreakAnimation from "@/components/celebrations/StreakAnimation";
   import ConfettiExplosion from "@/components/celebrations/ConfettiExplosion";
   import DailyCompleteModal from "@/components/celebrations/DailyCompleteModal";

2. Adicione os states de celebração:
   const [showCelebration, setShowCelebration] = useState<
     "none" | "micro" | "streak" | "confetti" | "daily_complete"
   >("none");
   const [celebrationStreak, setCelebrationStreak] = useState(0);

3. Localize onde o dose é marcada como "taken" em TodayRedesign.tsx
   (busque por onTake, handleTake, markDose ou similar).
   Após o sucesso da marcação, obtenha o streak atual do usuário
   (busque por useStreak, userStats.streak, ou similar no contexto/hook existente)
   e dispare a celebração proporcional:

   const handleDoseTaken = async (doseId: string) => {
     // ... lógica existente de marcar dose ...

     // Celebração proporcional ao streak
     const currentStreak = userStats?.streak ?? 0;
     const allDonesToday = /* verifica se todas as doses do dia foram tomadas */;

     if (allDonesToday) {
       setShowCelebration("daily_complete");
     } else if (currentStreak >= 30) {
       setCelebrationStreak(currentStreak);
       setShowCelebration("confetti");
     } else if (currentStreak >= 7) {
       setCelebrationStreak(currentStreak);
       setShowCelebration("streak");
     } else {
       setShowCelebration("micro");
     }

     // Auto-dismiss após 2.5 segundos
     setTimeout(() => setShowCelebration("none"), 2500);
   };

4. No JSX, adicione os componentes de celebração condicionalmente:
   {showCelebration === "micro" && <MicroCelebration onComplete={() => setShowCelebration("none")} />}
   {showCelebration === "streak" && <StreakAnimation streak={celebrationStreak} onComplete={() => setShowCelebration("none")} />}
   {showCelebration === "confetti" && <ConfettiExplosion onComplete={() => setShowCelebration("none")} />}
   {showCelebration === "daily_complete" && <DailyCompleteModal isOpen={true} onClose={() => setShowCelebration("none")} />}

5. Verifique as props de cada componente de celebração lendo seus arquivos em
   src/components/celebrations/ antes de implementar — use as props reais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — CLARA PROATIVA EM TodayRedesign.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Atualmente ClaraProactiveCard está em Today.tsx (versão antiga) mas não em
TodayRedesign.tsx (a página que o usuário vê).

1. Abra src/components/ClaraProactiveCard.tsx para entender as props que aceita.

2. No TodayRedesign.tsx, adicione o import:
   import ClaraProactiveCard from "@/components/ClaraProactiveCard";

3. Adicione o componente no JSX de TodayRedesign, APÓS a lista de doses do dia
   (depois do bloco de doses pendentes/tomadas, antes do footer/navigation):

   <ClaraProactiveCard
     context="home"
     /* passe as props necessárias baseadas na assinatura real do componente */
   />

4. Leia as props do componente antes de implementar. Se ClaraProactiveCard
   precisar de dados de streak, doses ou perfil, use os hooks já presentes
   em TodayRedesign.tsx para passá-los.

5. Confirme que ClaraProactiveCard NÃO aparece em nenhuma outra página além de
   TodayRedesign. Rode:
   grep -rn "ClaraProactiveCard" src/pages/ --include="*.tsx"
   Se aparecer em outras páginas que não sejam TodayRedesign, remova.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL: Teste o core loop manualmente:
1. Abrir TodayRedesign → ver HeroNextDose com countdown ativo
2. Marcar dose → ver celebração proporcional aparecer e sumir em 2.5s
3. Ver ClaraProactiveCard com mensagem contextual abaixo das doses
npm run build sem erros TypeScript.
```

---

## PROMPT 5 — MIGRAÇÃO SUPABASE → FIREBASE (37 ARQUIVOS)
**Resolve:** a maior dívida técnica do projeto — elimina o banco legado completamente
**Arquivos:** 37 arquivos confirmados por auditoria (lista completa abaixo)
**Tempo estimado:** 3–5 dias (execute em sub-lotes por categoria)

```
Você é um engenheiro de plataforma trabalhando no HoraMed.
A maior dívida técnica do projeto é a migração incompleta Supabase → Firebase.
Ainda há 37 arquivos importando de "@/integrations/supabase/client".

REGRA ABSOLUTA: não altere lógica de negócio — apenas substitua as chamadas
Supabase pelas equivalentes Firebase já estabelecidas no projeto.
Para cada substituição, baseie-se nos hooks Firebase já existentes em src/hooks/.

LOTE 1 — GAMIFICAÇÃO (4 arquivos) — execute primeiro, são críticos para retenção
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arquivos:
  src/components/gamification/DailyChallenges.tsx
  src/components/gamification/FamilyLeaderboard.tsx
  src/components/gamification/WeeklyChallenges.tsx
  src/components/gamification/WeeklyLeaderboard.tsx

Para cada arquivo:
1. Leia o arquivo completo.
2. Identifique cada chamada Supabase (supabase.auth.getUser(), supabase.from(...).select(...), etc.)
3. Mapeie para o equivalente Firebase:
   - supabase.auth.getUser() → import { auth } from "@/lib/firebase"; auth.currentUser
   - supabase.from("tabela").select("*").eq("user_id", uid) → useCollection de Firestore
     ou getDocs(query(collection(db, "users", uid, "subcoleção"), where(...)))
4. Remova o import do Supabase.
5. Adicione os imports do Firebase necessários.
6. Teste a funcionalidade correspondente.

LOTE 2 — CALENDÁRIOS E HISTÓRICO (5 arquivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  src/components/HealthCalendar.tsx
  src/components/ImprovedCalendar.tsx
  src/components/MiniWeekCalendar.tsx
  src/components/MonthlyProgressCalendar.tsx
  src/components/MonthlyReportCard.tsx

Mesma abordagem do Lote 1. Calendários provavelmente consultam doses e eventos —
use os hooks useWeeklyDoses e useTodayData já existentes no projeto.

LOTE 3 — NOTIFICAÇÕES (6 arquivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  src/components/NotificationDiagnostics.tsx
  src/components/NotificationMetrics.tsx
  src/components/NotificationPermissionPrompt.tsx
  src/components/NotificationSettingsReminder.tsx
  src/components/VaccineNotificationSettings.tsx
  src/pages/Notifications.tsx

Notificações provavelmente leem/escrevem em users/{uid}/pushSubscriptions ou
users/{uid}/notificationMetrics — coleções já definidas nas Firebase Rules.

LOTE 4 — ONBOARDING (4 arquivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  src/components/onboarding/OnboardingStepNotifications.tsx
  src/components/onboarding/SmartOnboarding.tsx
  src/components/OnboardingScreens.tsx
  src/components/OnboardingTour.tsx

Onboarding provavelmente lê/escreve o perfil do usuário — use useUserProfiles
ou acesso direto ao documento users/{uid}.

LOTE 5 — HOOKS (6 arquivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  src/hooks/useAchievements.ts
  src/hooks/useAndroidAlarm.ts
  src/hooks/useCaregiverVaccineReminders.ts
  src/hooks/useSmartMedicationSuggestions.ts
  src/hooks/useVaccinationRecords.ts
  src/hooks/useVaccineReminders.ts
  src/hooks/useWeightInsights.ts

Hooks são os mais críticos pois são usados por múltiplos componentes.
Para cada hook: leia, identifique as queries Supabase, substitua por Firebase,
teste todos os componentes que importam o hook.

LOTE 6 — COMPONENTES VARIADOS (12 arquivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  src/components/DocumentOCR.tsx
  src/components/FeatureSpotlight.tsx
  src/components/GuidedTour.tsx
  src/components/PaymentMethodModal.tsx
  src/components/PrescriptionBulkAddWizard.tsx
  src/components/profile/ProfileStatsGrid.tsx
  src/components/SmartInsightsCard.tsx
  src/components/SpotlightSearch.tsx
  src/components/TutorialHint.tsx
  src/components/voice/VoiceOnboardingModal.tsx
  src/components/GuidedTour.tsx

ATENÇÃO — DocumentOCR.tsx usa supabase.functions.invoke("extract-document"):
  Esta é uma Edge Function do Supabase. Verifique se existe equivalente em
  Firebase Cloud Functions (functions/src/index.ts). Se sim, substitua por:
  import { getFunctions, httpsCallable } from "firebase/functions";
  const extractDocument = httpsCallable(functions, "extractDocument");
  Se não existir, crie a Cloud Function equivalente antes de migrar o componente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL DE TODOS OS LOTES:
1. Verifique se src/integrations/supabase/client.ts ainda é importado:
   grep -rl "supabase" src/ --include="*.ts" --include="*.tsx"
   O resultado deve ser VAZIO (zero arquivos).

2. Remova src/integrations/supabase/ completamente.

3. Remova @supabase/supabase-js do package.json:
   npm uninstall @supabase/supabase-js

4. Remova variáveis VITE_SUPABASE_* do .env (após confirmar que nada mais as usa).

5. npm install && npm run build — deve completar sem erros.

6. Documente em MIGRATION_COMPLETE.md: data, lotes concluídos, arquivos migrados.
```

---

## PROMPT 6 — ENGENHARIA: new Date() + REFERRAL TEST + DEVICE CAPABILITY
**Resolve:** 438 crashes potenciais · falta de teste de referral · falta de useDeviceCapability
**Arquivos:** todos em `src/` + novo `src/hooks/useDeviceCapability.ts` + novo teste
**Tempo estimado:** 2–3 dias (new Date é alto volume — use script)

```
Você é um engenheiro de estabilidade trabalhando no HoraMed.
Execute os três blocos em ordem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — PROTEGER 438 USOS DE new Date() COM SCRIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O CODING_STANDARDS.md proíbe new Date(variável). Há 438 ocorrências.
Fazer manualmente é inviável — use um script Python.

Crie o arquivo scripts/fix_unsafe_dates.py com o seguinte conteúdo:

```python
#!/usr/bin/env python3
"""
fix_unsafe_dates.py — Substitui new Date(variavel) por safeDateParse(variavel)
em todos os arquivos .ts/.tsx de src/.
Preserva: new Date() sem args, new Date(Date.now()), new Date("2024-..."), new Date(2024, ...).
"""
import os, re, sys

SRC_DIR = os.path.join(os.path.dirname(__file__), '..', 'src')
IMPORT_LINE = 'import { safeDateParse } from "@/lib/safeDateUtils";'

# Padrão: new Date( seguido de algo que não seja: ), Date.now, dígito, string literal
UNSAFE_PATTERN = re.compile(
    r'new Date\((?!'                  # new Date(
    r'\s*\)'                           # ) — sem argumento
    r'|Date\.now'                      # Date.now()
    r'|["\']'                          # string literal
    r'|\d'                             # número literal
    r'|new\s'                          # new Date(new ...)
    r')'
    r'([^)]+)\)',                       # captura o argumento
    re.MULTILINE
)

fixed_files = []

for root, dirs, files in os.walk(SRC_DIR):
    # Ignora pastas de teste e node_modules
    dirs[:] = [d for d in dirs if d not in ['node_modules', '__tests__', 'tests']]
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')) or fname.endswith('.test.ts'):
            continue
        path = os.path.join(root, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = UNSAFE_PATTERN.sub(r'safeDateParse(\1)', content)

        if new_content != content:
            # Adiciona import se necessário
            if IMPORT_LINE not in new_content and 'safeDateUtils' not in new_content:
                # Encontra a última linha de import e adiciona depois
                lines = new_content.split('\n')
                last_import = 0
                for i, line in enumerate(lines):
                    if line.startswith('import '):
                        last_import = i
                lines.insert(last_import + 1, IMPORT_LINE)
                new_content = '\n'.join(lines)

            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            fixed_files.append(path.replace(SRC_DIR, 'src'))

print(f"✅ {len(fixed_files)} arquivos corrigidos:")
for f in fixed_files:
    print(f"  {f}")
```

Execute o script:
  cd /path/to/horamed
  python3 scripts/fix_unsafe_dates.py

Depois:
1. Rode npm run build — se houver erros de TypeScript onde safeDateParse
   retorna Date | null mas o código esperava Date, corrija manualmente
   adicionando o null check:
   ANTES: const d = safeDateParse(val); d.getTime()
   DEPOIS: const d = safeDateParse(val); if (!d) return; d.getTime()

2. Verifique manualmente os 10 primeiros arquivos corrigidos para garantir
   que a substituição faz sentido no contexto.

3. Rode npm run build novamente — deve completar sem erros.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — TESTE DE REFERRAL (INDICAÇÃO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Localize o serviço/hook de indicações:
  find src/ -name "*referral*" -o -name "*Referral*" -o -name "*indicac*"
  grep -rl "referral\|indicac\|reward.*premium\|discount.*refer" src/ --include="*.ts" | head -5

Crie src/tests/referral.test.ts com os seguintes testes:

import { describe, it, expect, vi, beforeEach } from 'vitest';
// Importe o serviço/hook de referral encontrado acima

describe('Sistema de Indicações (Referral)', () => {
  describe('Desconto para usuários Premium que indicam', () => {
    it('deve aplicar 20% de desconto por 1 indicação Premium ativa', () => {
      // Arrange: usuário com 1 referido que é premium
      // Act: calcular desconto
      // Assert: desconto = 20%
    });

    it('deve acumular descontos com múltiplas indicações', () => {
      // Arrange: usuário com 3 referidos premium
      // Act: calcular desconto total
      // Assert: desconto = 60% (ou o máximo definido, ex: 100%)
    });

    it('não deve ultrapassar 100% de desconto', () => {
      // Arrange: usuário com 10 referidos premium
      // Act: calcular desconto
      // Assert: desconto máximo = 100%
    });
  });

  describe('Slots extras para usuários Free que indicam', () => {
    it('deve adicionar 1 slot de medicamento por indicação Free ativa', () => {
      // Arrange: free user com 2 indicações free ativas
      // Act: calcular maxActive
      // Assert: maxActive = 5 (base) + 2 (extra slots) = 7
    });

    it('não deve exceder o máximo de slots extras permitidos', () => {
      // Arrange: free user com 10 indicações
      // Act: calcular maxActive
      // Assert: maxActive = limite máximo definido no sistema
    });
  });

  describe('Trial premium para quem é indicado', () => {
    it('novo usuário indicado deve receber trial premium de 7 dias', () => {
      // Arrange: novo usuário com código de indicação válido
      // Act: processar indicação
      // Assert: usuário tem subscription.plan = "premium" e trialEnd = +7 dias
    });

    it('código de indicação inválido não deve conceder trial', () => {
      // Arrange: código inexistente "INVALIDO123"
      // Act: tentar aplicar código
      // Assert: erro ou sem efeito no plano
    });
  });
});

Adapte os imports e a implementação dos testes ao serviço/hook real encontrado.
Rode: npx vitest run src/tests/referral.test.ts
Todos os testes devem passar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — useDeviceCapability PARA PERFORMANCE MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Crie src/hooks/useDeviceCapability.ts:

import { useMemo } from "react";

interface DeviceCapability {
  isLowPerformance: boolean;
  prefersReducedMotion: boolean;
  shouldReduceEffects: boolean;
}

/**
 * Detecta a capacidade do dispositivo para adaptar efeitos visuais.
 * - isLowPerformance: menos de 4 cores ou menos de 4GB de RAM
 * - prefersReducedMotion: preferência do SO por menos animação
 * - shouldReduceEffects: true se qualquer condição de redução estiver ativa
 */
export function useDeviceCapability(): DeviceCapability {
  return useMemo(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cores = navigator.hardwareConcurrency ?? 8;
    // deviceMemory é experimental mas bem suportado no Android
    const memory = (navigator as any).deviceMemory ?? 8;

    const isLowPerformance = cores < 4 || memory < 4;
    const shouldReduceEffects = isLowPerformance || prefersReducedMotion;

    return { isLowPerformance, prefersReducedMotion, shouldReduceEffects };
  }, []);
}

Depois, aplique o hook nos componentes que mais pesam:

1. Em src/components/HeroNextDose.tsx:
   const { shouldReduceEffects } = useDeviceCapability();
   Nas animações Framer Motion: animate={shouldReduceEffects ? {} : animationVariant}

2. Em qualquer componente que usa backdrop-blur (glassmorphism):
   className={cn(
     "rounded-2xl",
     shouldReduceEffects
       ? "bg-white border border-gray-100"
       : "bg-white/80 backdrop-blur-md"
   )}

3. Adicione ao index.css (se não existir):
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AO FINAL:
- npm run build — sem erros
- npx vitest run — todos os testes passando
- grep -c "new Date(" src/ -r --include="*.tsx" --include="*.ts" | grep -v ":0"
  (apenas arquivos com 0 ocorrências restantes devem aparecer)
```

---

## CHECKLIST FINAL V2 — NOTA 10

### Segurança ✅
- [ ] Firebase Rules: regra de cuidador (isCaregiverOf) adicionada
- [ ] Firebase Rules: coleção sharedDocuments com expiresAt
- [ ] shareDocumentService.ts com crypto.randomUUID() + Timestamp
- [ ] Nenhuma chave hardcoded (já ok)

### Produto ✅
- [ ] useMedicationLimits.ts: maxActive = 5
- [ ] GamificationHub.tsx: links → /meu-progresso
- [ ] GamificationWidget.tsx: links → /meu-progresso
- [ ] MeuProgresso.tsx: tab "appointments" → Jornada com Gamification

### Design ✅
- [ ] index.css: gradientes ≤ 15
- [ ] 12 componentes: animate={{ height }} → opacity/transform
- [ ] Navigation.tsx: min-h-[44px] nos itens
- [ ] Fluid typography: já ok ✅
- [ ] CardBase.tsx: já existe ✅

### Core Loop ✅
- [ ] HeroNextDose.tsx: countdown regressivo ao vivo
- [ ] TodayRedesign.tsx: celebração proporcional ao streak
- [ ] TodayRedesign.tsx: ClaraProactiveCard contextual
- [ ] Optimistic update: já ok ✅

### Engenharia ✅
- [ ] 0 arquivos importando Supabase
- [ ] 0 new Date(variável) sem safeDateParse
- [ ] Testes de referral passando
- [ ] useDeviceCapability aplicado nos componentes pesados
- [ ] microcopy.ts: já ok ✅
- [ ] prefers-reduced-motion: já ok ✅
