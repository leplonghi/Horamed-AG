# KAMP Agency - Documentação do Sistema

## 🎯 Conceito
O KAMP Agency transforma o antigo "Gerador de Copy" em um **Gerenciador de Vida de Marketing (Marketing Life Manager)**. 
Em vez de apenas gerar textos, o sistema atua como um CMO digital, entregando **Cronogramas, Scripts, Fluxos Visuais e Direção Criativa**.

## 🏗️ Estrutura do Novo Fluxo

### 1. DNA do Negócio (Identidade)
Antes de escrever qualquer palavra, o sistema precisa entender quem é o cliente.
- **Magic Autofill**: Ao selecionar um nicho (ex: Nutrição), o sistema preenche automaticamente as dores e desejos para reduzir a fricção.
- **Dados Coletados**: Produto, Público, Dor e Benefício.

### 2. Objetivo Estratégico (Goal)
Em vez de escolher "Canal", o usuário escolhe o **Objetivo**. O sistema decide os canais ideais.
- **Dynamic Inputs**: Se escolher "Lançamento Relâmpago", o sistema pergunta a oferta específica.
- **Objetivos**:
    - **📅 Planejamento Semanal**: Um calendário completo de 7 dias.
    - **🚀 Lançamento Relâmpago**: Sequência de alta conversão.
    - **💬 Explosão de Engajamento**: Para reaquecer a base.
    
### 3. Dashboard de Resultados (Life Manager)
A saída não é mais apenas um texto corrido. É um **Dashboard Completo**:
- **📊 Visão Geral**: Resumo da estratégia, tom de voz e potencial estimado.
- **📅 Cronograma**: Planner semanal visual (estilo Kanban).
- **🔀 Fluxos**: Visualização da jornada do cliente (ex: Atração -> Conexão -> Conversão).
- **📝 Textos (Copy)**: Todos os scripts organizados.
- **🎨 Criativos**: Sugestões visuais para Reels/Stories e temas baseados no tom de voz.

## 🛠️ Arquitetura Técnica
- **Frontend**: React + Framer Motion (Wizard intuitivo de 3 passos).
- **Dashboard**: Interface tabulada (`Tabs`) para organizar a informação complexa.
- **Logic**: 
    - `generateCampaignCopy`: Cria os textos.
    - `strategyPlan`: Gera o calendário dinâmico.
    - `Dynamic Inputs`: Renderização condicional baseada no `campaignGoal`.

## 🚀 Próximos Passos (Roadmap)
- [ ] **Integração com IA Real**: Substituir os templates estáticos por chamadas à API da OpenAI/Gemini.
- [ ] **Geração de Imagens**: Conectar com DALL-E/Midjourney para criar as capas sugeridas.
- [ ] **Agendamento**: Conectar com APIs do Meta/WhatsApp para postar automaticamente.
