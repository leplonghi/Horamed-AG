# Plano de Refatoração e Profissionalização - HoraMed

Este documento detalha o plano para realizar uma refatoração completa e otimização do aplicativo HoraMed, visando transformá-lo em um produto de nível profissional, mantendo a integridade do código existente.

## 🛠 Ativação de Agentes Especialistas
- `orchestrator`: Coordenação global.
- `frontend-specialist`: Refatoração de componentes, UI/UX e Tipagem.
- `backend-specialist`: Otimização de consultas Firebase/Supabase e tipagem de dados.
- `performance-optimizer`: Modularização de arquivos massivos e redução de re-renders.
- `debugger`: Correção de bugs latentes identificados nos alertas de Lint.

## 📊 Diagnóstico Inicial (Audit)
- **Lint**: 432 avisos (0 erros). Maioria relacionada a uso de `any` e dependências de Hooks.
- **Arquivos Críticos**:
    - `LanguageContext.tsx`: >7000 linhas (Crítico para performance e manutenção).
    - `usePushNotifications.ts`: ~1000 linhas.
    - `functions/src/index.ts`: ~1100 linhas (Cloud Functions monolíticas).
- **Tipagem**: Uso excessivo de `any` em integrações com Firestore e Stripe.

## 🚀 Fases de Implementação

### Fase 1: Saneamento e Tipagem (Fundação)
1. **Remover `any`**: Criar interfaces e tipos robustos para os modelos de dados (Doses, Medicamentos, Usuário, Stripe).
2. **Corrigir Lint**: Resolver os 432 avisos, focando em `exhaustive-deps` para evitar bugs silenciosos de estado.
3. **Padrões de Exportação**: Corrigir avisos de `react-refresh` para garantir que o HMR (Hot Module Replacement) funcione perfeitamente.

### Fase 2: Desmembramento e Modularização (Arquitetura)
1. **Refatorar `LanguageContext.tsx`**:
    - Mover as traduções para arquivos JSON separados por idioma (`public/locales/`).
    - Usar uma biblioteca como `i18next` ou implementar um loader assíncrono para reduzir o bundle size inicial.
2. **Modularizar Hooks Longos**: Quebrar `usePushNotifications` e outros hooks gigantes em sub-hooks focados (ex: `usePushPermissions`, `useNotificationSync`).
3. **Cloud Functions**: Dividir `functions/src/index.ts` em arquivos separados por domínio (Stripe, Cron, Auth).

### Fase 3: Otimização de Performance (UX Profissional)
1. **Memoização**: Implementar `React.memo`, `useMemo` e `useCallback` estrategicamente nos componentes de lista (Doses, Histórico).
2. **Lazy Loading**: Garantir que todas as rotas e modais pesados sejam carregados sob demanda.
3. **Consultas Eficientes**: Adicionar índices e otimizar queries no Firestore/Supabase para evitar carregamento excessivo de dados.

### Fase 4: Polimento Visual e Consistência (Design)
1. **Design System**: Unificar tokens de cores e espaçamentos.
2. **Micro-animações**: Adicionar transições suaves usando Framer Motion em mudanças de estado.
3. **Feedback Profissional**: Implementar skeletons de carregamento e estados de erro elegantes em todas as telas.

## 🧪 Verificação e Testes
- Rodar `lint_runner.py` e `security_scan.py` após cada fase.
- Testes manuais em mobile e desktop.
- Monitoramento de Performance (Lighthouse).

---
**Status**: 🔴 Aguardando respostas do Socratic Gate.
