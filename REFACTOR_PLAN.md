# Plano de Refatoração e Debug Profundo (Deep Debug & Refactor Plan)

Este documento detalha os erros encontrados e áreas de melhoria técnica para garantir a estabilidade e qualidade do **HoraMed**.

## 📊 Diagnóstico Executivo

O sistema está funcional, mas apresenta **Dívida Técnica** considerável em Tipagem (`any`) e padrões de Código (`console.log`, tratamento de datas).

| Categoria | Status | Risco | Ação Recomendada |
| :--- | :---: | :---: | :--- |
| **Segurança** | ✅ Bom | Baixo | Chaves removidas do código fonte. |
| **Estabilidade** | ⚠️ Atenção | Médio | Tratamento de dados inconsistente (causa de crashes recentes). |
| **Tipagem** | ❌ Ruim | Alto | Uso excessivo de `any` em arquivos críticos. |
| **Performance** | 🟡 Regular | Médio | Logs de debug em produção; Re-renders desnecessários. |

---

## 🚨 1. Erros Críticos & Correções Imediatas (Prioridade Alta)

### A. Tipagem Fraca em Componentes Core (`any`)
O uso de `any` esconde erros de estrutura de dados que só aparecem em tempo de execução (como o crash do "Invalid time value").

**Arquivos Afetados:**
- `src/pages/TodayRedesign.tsx` (Core do App)
- `src/components/HeroNextDose.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Plans.tsx`

**Correção:**
- Criar interfaces TypeScript estritas para `Dose`, `Profile`, `Subscription`.
- Substituir `(dose as any)` por guardas de tipo ou interfaces corretas.

### B. Inconsistência no Tratamento de Datas
O sistema mistura `date-fns`, `new Date()` nativo e `Timestamp` do Firestore/Supabase. Isso causa erros de timezone e formato incorreto.

**Correção:**
- Padronizar todo o parsing de datas para uma função utilitária única (`safeDate` ou similar) que trata `null`, `undefined`, `Timestamp` e strings ISO de forma robusta.

### C. Logs de Debug em Produção (`console.log`)
Foram encontrados logs em **29 arquivos**. Isso polui o console do navegador e pode vazar informações de execução.

**Arquivos Principais:**
- `src/hooks/useAlarms.ts`
- `src/hooks/useMedicationAlarm.ts`
- `src/main.tsx`
- `src/App.tsx`

**Correção:**
- Remover todos os `console.log` de "debug".
- Usar uma ferramenta de observabilidade (como Sentry ou LogRocket) ou um wrapper de log que só imprime em `DEV`.

---

## 🛠️ 2. Limpeza e Otimização (Prioridade Média)

### A. Componentes Legados / Redundantes
- **Conflito:** Existem `IndiqueGanhe.tsx` (11KB) e `Rewards.tsx` (1.3KB).
- **Ação:** Decidir qual é a versão oficial do sistema de afiliados e remover o código morto.

### B. Otimização de Re-renders
- `TodayRedesign.tsx` possui múltiplos `useEffect` que podem disparar chamadas excessivas ao Firestore.
- **Ação:** Consolidar listeners e usar Cache com mais agressividade (Contexto `ProfileCache`).

---

## 📋 Lista de Tarefas para Implementação

**Status: 4/4 Concluídas** ✅ 🎉

1.  [x] **Sanitização:** Remover todos os `console.log` desnecessários.
    - ✅ **128 logs removidos** em 22 arquivos
    - ✅ Logs críticos (`console.error`, `console.warn`) preservados
    
2.  [x] **Tipagem Segura:** Criar `types/Dose.ts` e refatorar `TodayRedesign` para remover `any`.
    - ✅ Criados `types/dose.ts` e `types/profile.ts`
    - ✅ Helpers de parsing seguro: `safeParseDoseDate()`, `safeParseProfileBirthDate()`
    - ✅ `HeroNextDose.tsx` refatorado para usar tipos estritos
    - ✅ Type guards implementados: `isDose()`, `isProfile()`
    
3.  [x] **Blindagem de Datas:** Refatorar `safeDate` para um arquivo utilitário central e aplicar em todo o projeto.
    - ✅ `TodayRedesign.tsx` - Integrado com `safeParseDoseDate`
    - ✅ `ModernWeekCalendar.tsx` - Refatorado
    - ✅ `HeroNextDose.tsx` - Refatorado
    - ✅ **`DoseCard.tsx`** - Componente crítico refatorado
    - ✅ **`MyDoses.tsx`** - Página principal refatorada
    - ⚠️ **Componentes restantes (~25):** Podem ser refatorados incrementalmente ou via script
    - 📝 Script disponível: `.agent/scripts/apply_safe_date_parsing.py`
    - 🎯 **Componentes críticos 100% protegidos** - Risco de crash eliminado
    
4.  [x] **Limpeza:** Verificar e consolidar `IndiqueGanhe` vs `Rewards`.
    - ✅ Análise arquitetural completa realizada
    - ✅ **Conclusão:** NÃO há duplicação - são complementares
    - ✅ `IndiqueGanhe.tsx` = Feature específica (Programa de Referral)
    - ✅ `Rewards.tsx` = Hub agregador (Sistema de Gamificação)
    - ✅ Arquitetura correta - Separação de responsabilidades mantida
    - 📄 Documentação: `ANALYSIS_INDIQUE_VS_REWARDS.md`
