# HoraMed — Nota 10 Master Plan

## Goal
Elevar cada módulo do HoraMed para nota 10/10 em: Performance, UX, Monetização, Segurança, Arquitetura, Originalidade.

## Prioridades por Impacto

### P0 — CRÍTICO (bloqueante para produção)
- [ ] T1: Refatorar TodayRedesign.tsx — quebrar em sub-componentes + onSnapshot isolados → Verify: re-renders controlados, sem cascata
- [ ] T2: Vendor chunk 1.8MB — lazy load pdfjs + code split recharts/framer-motion → Verify: build, vendor < 800KB  
- [ ] T3: Correlação dose→sintoma no SideEffectsDiary → Verify: clicar log vê dose relacionada

### P1 — ALTO (UX/Conversão)  
- [ ] T4: Plans — Lifetime como opção padrão selecionada, ROI calculator → Verify: Lifetime visualmente destacado por padrão
- [ ] T5: Navigation page transitions — framer-motion entre páginas → Verify: animação visível ao navegar
- [ ] T6: More page — ícones coloridos por seção, stagger animation → Verify: visual premium

### P2 — MÉDIO (Polimento)
- [ ] T7: FreeRewardsCard/PremiumRewardsCard — substituir <img> por SVG/emojis inline → Verify: sem 404
- [ ] T8: SplashScreen — wave/morph transition → Verify: animação fluida na entrada
- [ ] T9: MorePage — add SideEffectsDiary link com badge → Verify: link visível

### P3 — SEGURANÇA
- [ ] T10: Verificar git history para service-account.json → Verify: git log --all não mostra arquivo sensível

## Done When
- [ ] Build zero erros/warnings TypeScript
- [ ] Vendor chunk < 900KB gzipped
- [ ] TodayRedesign tem sub-componentes isolados
- [ ] Plans = Lifetime por padrão
- [ ] Todas as imagens por img-tag substituídas por inline SVG/emoji
