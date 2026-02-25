# 🎮 HoraMed - Sistema Completo de Gamificação

> **Objetivo**: Aumentar engajamento, retenção e conversão através de mecânicas de jogo  
> **Meta**: 60% conversão Free→Pro via gamificação  
> **Integração**: Firebase + Stripe + Push Notifications

---

## 🏆 ARQUITETURA DO SISTEMA

### Componentes Principais

```
GAMIFICATION_SYSTEM/
├── Badges (Conquistas)
├── Streaks (Sequências)
├── Points (Pontos)
├── Levels (Níveis)
├── Leaderboards (Ranking)
├── Rewards (Recompensas)
└── Referrals (Indicações)
```

---

## 🎖️ SISTEMA DE BADGES

### Categorias de Badges

#### 1. Onboarding (Primeiros Passos)
| Badge | Ícone | Condição | Recompensa |
|-------|-------|----------|------------|
| **Bem-vindo** | 👋 | Completou cadastro | +50 pontos |
| **Primeiro Passo** | 🏆 | Cadastrou 1º medicamento | +100 pontos |
| **Organizado** | 📋 | Cadastrou 1ª consulta | +100 pontos |
| **Preparado** | 🔬 | Cadastrou 1º exame | +100 pontos |
| **Completo** | ✅ | Preencheu perfil 100% | +200 pontos |

#### 2. Adesão (Streaks)
| Badge | Ícone | Condição | Recompensa |
|-------|-------|----------|------------|
| **Streak Iniciante** | 🔥 | 7 dias consecutivos | +300 pontos |
| **Streak Dedicado** | 🔥🔥 | 30 dias consecutivos | +1.000 pontos + 10% desconto Pro |
| **Streak Mestre** | 🔥🔥🔥 | 100 dias consecutivos | +5.000 pontos + 1 mês grátis Pro |
| **Streak Lendário** | 👑 | 365 dias consecutivos | +20.000 pontos + 3 meses grátis Pro |
| **Perfeccionista** | 🎯 | 100% adesão semanal | +500 pontos |

#### 3. Social (Indicações)
| Badge | Ícone | Condição | Recompensa |
|-------|-------|----------|------------|
| **Influencer** | 👥 | 1ª indicação aceita | +200 pontos |
| **Embaixador Bronze** | 🥉 | 5 indicações | +1.000 pontos + 10% desconto |
| **Embaixador Prata** | 🥈 | 20 indicações | +5.000 pontos + 1 mês grátis |
| **Embaixador Ouro** | 🥇 | 50 indicações | +15.000 pontos + 6 meses grátis |
| **Embaixador Diamante** | 💎 | 100 indicações | **Acesso Vitalício Pro** |

#### 4. Engajamento
| Badge | Ícone | Condição | Recompensa |
|-------|-------|----------|------------|
| **Analista** | 📊 | Gerou 1º relatório | +150 pontos |
| **Cientista** | 🔬 | Gerou 10 relatórios | +500 pontos |
| **Feedback Master** | 💬 | Enviou 5 feedbacks | +300 pontos |
| **Avaliador** | ⭐ | Avaliou app na loja | +500 pontos + surpresa |

#### 5. Premium
| Badge | Ícone | Condição | Recompensa |
|-------|-------|----------|------------|
| **Premium** | 💎 | Upgrade para Pro | +1.000 pontos |
| **Fiel** | 👑 | 6 meses assinante | +3.000 pontos |
| **Vitalício** | ♾️ | Acesso vitalício | Badge exclusivo |

---

## 🔥 SISTEMA DE STREAKS

### Mecânica

```typescript
interface Streak {
  userId: string;
  currentStreak: number; // dias consecutivos
  longestStreak: number; // recorde pessoal
  lastCheckIn: Timestamp;
  freezeCount: number; // "vidas" para não perder streak
}

// Regras
- Streak aumenta: Tomou todos os remédios do dia (100% adesão)
- Streak mantém: Usou "freeze" (máximo 3 por mês, apenas Pro)
- Streak quebra: Perdeu medicamento sem freeze
- Reset: Streak volta a 0, mas longestStreak permanece
```

### Milestones de Streak

| Dias | Milestone | Recompensa | Notificação |
|------|-----------|------------|-------------|
| 3 | Aquecendo | +50 pontos | "3 dias! Continue assim 🔥" |
| 7 | Iniciante | Badge + 300 pontos | "1 semana perfeita! 🎉" |
| 14 | Consistente | +600 pontos | "2 semanas! Você é incrível 💪" |
| 30 | Dedicado | Badge + 1.000 pontos + 10% desconto | "1 MÊS! Desbloqueou desconto 🎁" |
| 60 | Comprometido | +2.000 pontos | "2 meses! Top 10% dos usuários 🏆" |
| 100 | Mestre | Badge + 5.000 pontos + 1 mês grátis | "100 DIAS! Você é uma lenda 👑" |
| 365 | Lendário | Badge + 20.000 pontos + 3 meses grátis | "1 ANO PERFEITO! 🎊🎊🎊" |

---

## ⭐ SISTEMA DE PONTOS

### Como Ganhar Pontos

| Ação | Pontos | Frequência |
|------|--------|------------|
| Tomou medicamento no horário | +10 | Por medicamento |
| Tomou TODOS os medicamentos do dia | +50 | Diário |
| Cadastrou novo medicamento | +20 | Ilimitado |
| Cadastrou consulta | +30 | Ilimitado |
| Cadastrou exame | +30 | Ilimitado |
| Gerou relatório | +50 | Semanal |
| Indicou amigo (aceito) | +200 | Ilimitado |
| Avaliou app na loja | +500 | 1x |
| Completou perfil | +100 | 1x |
| Atingiu streak milestone | Variável | Por milestone |
| Desbloqueou badge | Variável | Por badge |

### Como Usar Pontos

| Recompensa | Custo | Disponibilidade |
|------------|-------|-----------------|
| 1 Freeze de Streak | 500 pontos | Apenas Pro |
| Tema Premium | 1.000 pontos | Todos |
| Avatar Exclusivo | 2.000 pontos | Todos |
| 1 Semana Pro (trial) | 3.000 pontos | Apenas Free |
| 10% Desconto Pro (1 mês) | 5.000 pontos | Todos |
| 1 Mês Pro Grátis | 10.000 pontos | Apenas Free |

---

## 🎚️ SISTEMA DE NÍVEIS

### Progressão

```typescript
interface UserLevel {
  level: number; // 1-100
  currentXP: number;
  xpToNextLevel: number;
  title: string; // "Iniciante", "Dedicado", etc.
}

// Fórmula XP para próximo nível
xpToNextLevel = 100 * level * 1.5

// Exemplo:
Level 1 → 2: 150 XP
Level 2 → 3: 300 XP
Level 10 → 11: 1.500 XP
```

### Títulos por Nível

| Nível | Título | Benefício |
|-------|--------|-----------|
| 1-5 | Iniciante 🌱 | - |
| 6-10 | Aprendiz 📚 | +5% pontos |
| 11-20 | Dedicado 💪 | +10% pontos |
| 21-35 | Experiente 🎯 | +15% pontos + 1 freeze/mês |
| 36-50 | Mestre 🏆 | +20% pontos + 2 freezes/mês |
| 51-75 | Especialista 👑 | +25% pontos + 3 freezes/mês |
| 76-99 | Lendário ⭐ | +30% pontos + 5 freezes/mês |
| 100 | Imortal 💎 | +50% pontos + freezes ilimitados + badge exclusivo |

---

## 🏅 LEADERBOARDS (Ranking)

### Tipos de Ranking

#### 1. Streak Global
- Top 100 usuários com maior streak atual
- Atualização: Tempo real
- Prêmio mensal: Top 3 ganham 1 mês Pro grátis

#### 2. Pontos Mensais
- Ranking resetado todo mês
- Top 10 ganham badges exclusivos
- Top 1 ganha 3 meses Pro grátis

#### 3. Indicações
- Top indicadores do mês
- Prêmio: Upgrade para Embaixador Oficial (benefícios exclusivos)

### Privacidade
- Usuário pode optar por aparecer como "Anônimo"
- Apenas username (não nome real)
- Opt-in obrigatório

---

## 🎁 PROGRAMA DE INDICAÇÕES (Referral)

### Mecânica

```typescript
interface Referral {
  referrerId: string; // Quem indicou
  referredId: string; // Quem foi indicado
  status: 'pending' | 'accepted' | 'converted'; // Estado
  createdAt: Timestamp;
  rewardClaimed: boolean;
}

// Fluxo
1. Usuário A compartilha link único: horamed.app/r/CODIGO_UNICO
2. Usuário B instala app via link
3. Backend registra referral (status: pending)
4. Usuário B completa onboarding → status: accepted
5. Usuário A recebe notificação + pontos
6. Usuário B faz upgrade Pro → status: converted
7. Usuário A recebe recompensa extra
```

### Recompensas por Indicação

| Milestone | Indicações | Recompensa Indicador | Recompensa Indicado |
|-----------|------------|----------------------|---------------------|
| 1ª | 1 | +200 pontos + Badge | +100 pontos |
| Bronze | 5 | +1.000 pontos + 10% desconto | - |
| Prata | 20 | +5.000 pontos + 1 mês grátis | - |
| Ouro | 50 | +15.000 pontos + 6 meses grátis | - |
| Diamante | 100 | **Acesso Vitalício Pro** 👑 | - |

### Bônus de Conversão
- Se indicado fizer upgrade Pro: +500 pontos extras para indicador
- Se indicado mantiver Pro por 3 meses: +1.000 pontos extras

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Firebase Collections

```typescript
// firestore.ts

// Collection: achievements
interface Achievement {
  id: string; // badge ID
  userId: string;
  badgeId: string; // "streak_7", "referral_5", etc.
  unlockedAt: Timestamp;
  points: number;
  notified: boolean;
}

// Collection: streaks
interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: Timestamp;
  freezeCount: number; // freezes disponíveis
  freezeUsed: number; // freezes usados este mês
}

// Collection: points
interface UserPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number; // total - gastos
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string;
}

// Collection: referrals
interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string; // código único do indicador
  status: 'pending' | 'accepted' | 'converted';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  convertedAt?: Timestamp;
  rewardClaimed: boolean;
}

// Collection: leaderboards
interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number; // streak ou pontos
  rank: number;
  period: string; // "2026-02", "all-time"
  type: 'streak' | 'points' | 'referrals';
}
```

### Cloud Functions

```typescript
// functions/src/gamification.ts

// Função: Verificar adesão diária e atualizar streak
export const checkDailyAdherence = functions.pubsub
  .schedule('every day 23:59')
  .onRun(async (context) => {
    const users = await getUsersWithMedications();
    
    for (const user of users) {
      const adherence = await calculateDailyAdherence(user.id);
      
      if (adherence === 100) {
        // Aumenta streak
        await incrementStreak(user.id);
        await addPoints(user.id, 50, 'daily_perfect');
        
        // Verifica milestones
        const streak = await getStreak(user.id);
        await checkStreakMilestones(user.id, streak.currentStreak);
      } else {
        // Verifica se tem freeze disponível
        const hasFreeze = await checkFreezeAvailable(user.id);
        if (hasFreeze) {
          // Pergunta ao usuário se quer usar freeze
          await sendFreezeNotification(user.id);
        } else {
          // Quebra streak
          await resetStreak(user.id);
          await sendStreakLostNotification(user.id);
        }
      }
    }
  });

// Função: Processar indicação aceita
export const onReferralAccepted = functions.firestore
  .document('referrals/{referralId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status === 'pending' && after.status === 'accepted') {
      const referrerId = after.referrerId;
      
      // Adiciona pontos ao indicador
      await addPoints(referrerId, 200, 'referral_accepted');
      
      // Verifica milestones de indicação
      const referralCount = await getReferralCount(referrerId);
      await checkReferralMilestones(referrerId, referralCount);
      
      // Notifica indicador
      await sendNotification(referrerId, {
        title: '🎉 Indicação aceita!',
        body: 'Seu amigo entrou no HoraMed. +200 pontos!',
      });
    }
  });

// Função: Gerar cupom Stripe ao atingir milestone
export const generateStripeCoupon = async (
  userId: string,
  milestoneType: string
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  let couponData;
  switch (milestoneType) {
    case 'referral_5':
      couponData = { percent_off: 10, duration: 'once' };
      break;
    case 'referral_10':
      couponData = { duration: 'repeating', duration_in_months: 1 };
      break;
    case 'referral_25':
      couponData = { duration: 'repeating', duration_in_months: 3 };
      break;
    case 'referral_100':
      // Acesso vitalício = adicionar à lista de premium users
      await addLifetimeAccess(userId);
      return;
  }
  
  const coupon = await stripe.coupons.create({
    ...couponData,
    name: `HoraMed - ${milestoneType}`,
    metadata: { userId, milestone: milestoneType },
  });
  
  // Salva cupom no Firestore
  await saveCouponToUser(userId, coupon.id);
  
  // Notifica usuário
  await sendNotification(userId, {
    title: '🎁 Recompensa desbloqueada!',
    body: `Seu cupom: ${coupon.id}. Use no checkout!`,
  });
};
```

### React Components

```typescript
// src/components/gamification/BadgeDisplay.tsx
interface BadgeDisplayProps {
  badge: Achievement;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'medium',
  showAnimation = false,
}) => {
  return (
    <div className={`badge-container ${size}`}>
      {showAnimation && <Confetti />}
      <div className="badge-icon">{badge.icon}</div>
      <div className="badge-name">{badge.name}</div>
      <div className="badge-points">+{badge.points} pts</div>
    </div>
  );
};

// src/components/gamification/StreakCounter.tsx
export const StreakCounter: React.FC = () => {
  const { currentStreak, longestStreak } = useStreak();
  
  return (
    <div className="streak-counter">
      <div className="current-streak">
        <span className="flame-icon">🔥</span>
        <span className="streak-number">{currentStreak}</span>
        <span className="streak-label">dias</span>
      </div>
      <div className="longest-streak">
        Recorde: {longestStreak} dias
      </div>
      <StreakProgressBar current={currentStreak} />
    </div>
  );
};

// src/components/gamification/ReferralLink.tsx
export const ReferralLink: React.FC = () => {
  const { user } = useAuth();
  const referralCode = user?.referralCode || generateReferralCode(user.id);
  const referralLink = `https://horamed.app/r/${referralCode}`;
  
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'HoraMed - Sua saúde, simplificada',
        text: 'Experimente o melhor app de gerenciamento de saúde!',
        url: referralLink,
      });
    } else {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Link copiado!');
    }
  };
  
  return (
    <div className="referral-section">
      <h3>Indique e Ganhe 🎁</h3>
      <div className="referral-stats">
        <div>Indicações: {user.referralCount}</div>
        <div>Próxima recompensa: {getNextMilestone(user.referralCount)}</div>
      </div>
      <button onClick={handleShare}>Compartilhar Link</button>
      <ReferralProgress count={user.referralCount} />
    </div>
  );
};
```

---

## 🎯 ESTRATÉGIA DE RETENÇÃO

### Notificações Gamificadas

| Trigger | Notificação | Objetivo |
|---------|-------------|----------|
| Streak em risco | "⚠️ Seu streak de 15 dias está em risco! Tome seus remédios." | Prevenir churn |
| Milestone próximo | "🔥 Faltam 2 dias para 30 dias de streak! Continue!" | Motivar |
| Badge desbloqueado | "🏆 Parabéns! Você desbloqueou 'Streak Mestre'!" | Celebrar |
| Indicação aceita | "🎉 Seu amigo entrou! +200 pontos" | Reforçar social |
| Ranking subiu | "📈 Você subiu para #47 no ranking!" | Competição saudável |

### Emails de Engajamento

- **Dia 3**: "Você está indo bem! 3 dias de streak 🔥"
- **Dia 6**: "Amanhã você desbloqueia seu primeiro badge!"
- **Dia 14**: "Você está no top 30% dos usuários!"
- **Dia 29**: "AMANHÃ é o grande dia! 30 dias de streak = recompensa especial"

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Gamificação

| Métrica | Meta | Atual | Status |
|---------|------|-------|--------|
| % usuários com streak ativo | 40% | - | 🎯 |
| Streak médio (dias) | 15 | - | 🎯 |
| % usuários com badges | 80% | - | 🎯 |
| Indicações por usuário | 2 | - | 🎯 |
| Conversão via gamificação | 25% | - | 🎯 |
| Retenção D7 (com gamif) | 60% | - | 🎯 |
| Retenção D30 (com gamif) | 40% | - | 🎯 |

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: MVP (Semana 1-2)
- [ ] Implementar sistema de pontos básico
- [ ] Criar 5 badges essenciais (onboarding)
- [ ] Implementar streak counter
- [ ] Notificações de conquistas

### Fase 2: Social (Semana 3-4)
- [ ] Sistema de indicações completo
- [ ] Integração Stripe (cupons automáticos)
- [ ] Badges de indicação
- [ ] Compartilhamento social

### Fase 3: Competição (Semana 5-6)
- [ ] Leaderboards (3 tipos)
- [ ] Sistema de níveis
- [ ] Títulos por nível
- [ ] Ranking semanal/mensal

### Fase 4: Recompensas (Semana 7-8)
- [ ] Loja de pontos
- [ ] Temas premium
- [ ] Avatares exclusivos
- [ ] Freezes de streak

---

**Próximo Arquivo**: `referral-program-stripe.md` (integração técnica detalhada)
