---
description: Transição Arquitetural Global de SVGs (lucide-react para Phosphor Premium)
status: IN_PROGRESS
---

# Projeto de Identidade Visual: SVGs Profundos e Arquiteturais

## 1. Visão do Design
O objetivo é erradicar o `lucide-react` (ícones padronizados, estilo SaaS arredondado/clichê) e substituí-lo por uma solução radicalmente adaptável, aplicando um estilo **Profundo e Arquitetural**.

**Atributos Visuais:**
- **Linhas Técnicas e Geometria:** Traços finos e elegantes (geralmente entre `1px` e `1.5px`), privilegiando cruzamentos visuais intencionais e consistência estrutural rigorosa, distante do tradicional look "bubble/arredondado".
- **Composição de Profundidade:** Elementos em duas camadas de opacidade (Duo-tone Técnico). O contorno fornece a leitura clara, enquanto preenchimentos de suporte a 20% ou linhas secundárias criam a "planta baixa" do elemento. Muito técnico, muito premium.
- **Nova Biblioteca-Base:** Utilizaremos o pacote `@phosphor-icons/react`. Ele é infinitamente melhor na gestão de espessuras (`weight`, suportando `thin`, `light`, e a magia do `duotone`) do que o Lucide e permite aplicação de contexto global.

## 2. Abordagem de Fases de Transição
Dada a superfície de 300+ arquivos afetados, qualquer transição drástica integral causará uma implosão incontrolável do TypeScript. Trabalharemos com a refatoração iterativa abaixo:

### Fase 1: Fundação & Adoção Tática 
1. **[ ]** Instalar a nova lib: `npm i @phosphor-icons/react`.
2. **[ ]** Criar um contêiner de contexto global ou um Wrapper Técnico em `src/components/ui` para engessar o peso, opacidade, e espessura do traço no nível do app, garantindo que toda nova inserção nasça na estética do "Duo-tone Profundo".
3. **[ ]** Adaptar e sobrescrever as navegações primárias: *Bottom Navigation* e *Headers Globais*. Testar a sensação visual com as novas paletas do app antes de avançar para os componentes miúdos.

### Fase 2: O Núcleo do Aplicativo (Dashboards e Hubs)
1. **[ ]** Refatorar o Dashboard Principal e os cartões de "Métricas Vitais".
2. **[ ]** Refatorar `MedicamentosHub.tsx` e fluxos do Wizard (passos).
3. **[ ]** Refatorar `HealthDashboard.tsx`, calendários e timelines de saúde.

### Fase 3: Detalhes e Entranhas UI
1. **[ ]** Troca granular em botões avulsos, Toasts, Menus Dropdown e Cards genéricos.
2. **[ ]** Refatorar a área de Perfil, Configurações e Logs Históricos (que contém milhares de chevrons, lixeiras, etc.).
3. **[ ]** Empty States (telas de estado vazio/sem dados) e Telas de Onboarding.

### Fase 4: A Purificação Final (The Purge)
1. **[ ]** Buscar no projeto inteiro pelos remanescentes de importações do `lucide-react`.
2. **[ ]** Rodar o comando destruidor: `npm uninstall lucide-react`.
3. **[ ]** Validar robustez rodando `tsc` (TypeScript compiler) e Linter para certificar o ambiente perfeitamente saudável (sem broken imports).
