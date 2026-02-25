# Plano de Implementação: Localização de Serviços de Saúde

## 1. Visão Geral
Este documento detalha o plano para implementar a funcionalidade de encontrar serviços de saúde (farmácias, laboratórios, clínicas, hospitais) próximos ao usuário, priorizando aqueles que aceitam seu plano de saúde.

## 2. Análise de Complexidade (Planos de Saúde)
A integração direta via API com operadoras de planos de saúde (Unimed, Bradesco, Amil, etc.) para verificação em tempo real é **altamente complexa** e inviável para um MVP, pois:
- Não existe um padrão de API aberto.
- Requereria parcerias individuais ou uso de intermediários caros.
- Dados de "rede credenciada" mudam frequentemente.

### Estratégia Adotada (MVP)
Utilizaremos uma abordagem **híbrida e inteligente**:
1. **Cadastro Manual**: O usuário informa o nome do plano (ex: "Unimed", "Amil") no perfil.
2. **Busca Otimizada**: Utilizamos a **Google Places API** injetando o nome do plano na busca (ex: "Laboratório Unimed", "Farmácia Droga Raia convênio").
3. **Verificação Humana**: Fornecemos telefone e link direto para contato com o estabelecimento para confirmação final.

## 3. Arquitetura de Dados (Firestore)

### 3.1. Novos Campos no Perfil do Usuário (`users` collection)
```typescript
interface UserProfile {
  // ... campos existentes
  healthPlans: {
    id: string;
    operatorName: string; // ex: "Unimed", "Bradesco Saúde"
    planType?: string;    // ex: "Nacional", "Flex"
    cardNumber?: string;  // Opcional, criptografado se possível
    isTitular: boolean;   // Se é titular ou dependente
  }[];
  dependents?: {
    // ... estrutura similar para dependentes
    healthPlans: HealthPlan[];
  }[];
}
```

## 4. Componentes e Fluxo UX

### 4.1. Cadastro de Plano
- **Local**: Perfil > Meus Planos.
- **UI**: Lista de planos com botão "Adicionar Plano". Input com autocomplete (lista pré-definida das maiores operadoras para evitar typos).

### 4.2. Fluxo de Busca (Trigger)
- **Onde**: Ao visualizar uma Receita, Exame ou Consulta.
- **Botão**: "Encontrar Locais Próximos".
- **Lógica**:
  1. Detectar tipo do item (Receita -> Farmácia, Exame -> Laboratório, Consulta -> Clínica/Hospital).
  2. Obter plano de saúde do usuário (selecionar qual plano usar se houver múltiplos).
  3. Obter geolocalização (GPS).

### 4.3. Interface de Resultados
- **Mapa**: Pins com os locais encontrados.
- **Lista**: Cards ordenados por distância.
  - Nome do Local
  - Endereço
  - Distância (km)
  - Botão "Ligar"
  - Botão "Traçar Rota" (Google Maps/Waze)
  - Badge "Provável Aceitação" (Se o nome do plano estiver no nome do local ou reviews).

## 5. Implementação Técnica

### 5.1. Dependências
- `google-maps-platform-code-assist` (já disponível).
- `@react-google-maps/api` ou uso direto da Places API via Edge Function (para não expor chave no client se for server-side, mas Maps JS API é client-side).

### 5.2. Tarefas
- [ ] **Task 1**: Criar Interface de Cadastro de Planos de Saúde no Perfil.
- [ ] **Task 2**: Implementar Hook de Geolocalização (`useGeolocation`) com tratamento de permissão e erros.
- [ ] **Task 3**: Criar Serviço de Busca no Google Places (focado em saúde).
  - Queries: `pharmacy near me`, `laboratory accepting [PLAN]`, `hospital [PLAN]`.
- [ ] **Task 4**: Componente Visual `HealthServicesFinder` (Modal ou Página).
  - Tabs: Mapa / Lista.
- [ ] **Task 5**: Integrar pontos de entrada nas telas de Detalhes de Receita/Exame.

## 6. Segurança e Privacidade
- Dados do plano não são compartilhados com terceiros além da string de busca no Google.
- Localização usada apenas durante o uso da funcionalidade (não rastreia em background).
- Termos de Uso atualizados para refletir o uso de localização.

## 7. Diferenciação Free vs Pro
- **Free**: Limite de buscas diárias ou resultados limitados.
- **Pro**: Buscas ilimitadas, filtros avançados (ex: "Aberto 24h").
