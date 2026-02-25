# CampaignOS 2.0: Central de Marketing Inteligente

## 🎯 Visão Geral
Transformar o "Gerador de Campanhas" em um **Gerente de Marketing Digital (CMO) de Bolso**. 
O objetivo é que o aplicativo entenda profundamente o negócio do usuário e gerencie toda a estratégia de comunicação, não apenas gere textos avulsos.

---

## 🏗️ Nova Arquitetura de Fluxo

### 1. 🧠 Módulo de Identidade (Business DNA)
*Este passo é configurado uma vez (e editável), servindo de base para tudo.*
* **Nome do Produto/Serviço**
* **Nicho de Atuação** (SaaS, Fitness, Clínica, E-commerce, etc.)
* **Dores do Público**: O que o cliente sofre?
* **Desejos do Público**: O que o cliente sonha?
* **Tom de Voz da Marca**: (Amigável, Autoritário, Descontraído, Luxuoso).

### 2. 🧭 Seletor de Estratégia (O que faremos hoje?)
*Em vez de escolher "Canal", escolhemos o "Objetivo".*

| Tipo de Estratégia | Descrição | Entregáveis Gerados |
| :--- | :--- | :--- |
| **📅 Planner Semanal** | Estratégia de conteúdo para 7 dias | 7 Temas, 3 Posts Chave, 1 Ação de Venda |
| **🚀 Lançamento Relâmpago** | Campanha de vendas curta (48h-72h) | Sequência de Stories, 3 Emails, 5 msg WhatsApp |
| **🤝 Engajamento & Comunidade** | Aquecer e conectar com a base | Enquetes, Perguntas, Posts de Bastidores |
| **⚡ Post Avulso** | Conteúdo rápido para preencher buraco | 1 Legenda Master (adaptável) |

### 3. ✨ Motor de Geração (The Brain)
O motor pega o **Business DNA** + **Objetivo** e gera um **Pacote Multi-Canal**.
Não perguntamos mais "Qual canal?". Nós entregamos **TODOS** os canais pertinentes para aquela estratégia.

**Exemplo de Saída (Bundle):**
*   **Conceito Central:** "Semana da Produtividade"
*   **📱 Instagram/TikTok:**
    *   Ideia de Reel (Roteiro)
    *   Carrossel (Estrutura de slides)
    *   Legenda (Copy)
*   **💬 WhatsApp/Telegram:**
    *   Mensagem de Aquecimento (Segunda)
    *   Oferta VIP (Quarta)
    *   Escassez (Sexta)
*   **📧 Email:**
    *   Newsletter da semana.

---

## 📅 Funcionalidades Expandidas

### 1. Calendário Inteligente (Content Grid)
*   Visualização de Grade (Domingo a Sábado).
*   Arrastar e Soltar estratégias nos dias.
*   **Sugestão Preditiva:** "Seu público engaja mais terça-feira, poste a oferta aqui."

### 2. Biblioteca de Brand Assets
*   Guardar "Ofertas Irresistíveis" (para reuso).
*   Guardar "Depoimentos" (para injetar nas copys).

### 3. Ciclos de Marketing
*   O sistema sugere: "Você fez muita oferta semana passada. Vamos focar em Autoridade essa semana?"

---

## 📝 Roadmap de Implementação (Imediato)

1.  **Refatorar o Wizard (`CampaignGenerator.tsx`):**
    *   **Criar Step "Perfil"**: Coletar dados profundos do negócio antes de gerar.
    *   **Mover "Canais" para o Final**: O usuário seleciona quais canais quer *ver* no resultado, ou vê todos.
    *   **Novo Formatador**: O gerador deve devolver um objeto JSON com chaves `{ 'social': ..., 'whatsapp': ..., 'email': ... }`.

2.  **Unificar a Experiência**:
    *   A aba "Estratégia" deixa de ser separada e vira o **Ponto de Partida** ou a **Visão Global**.

---

## 💡 Cenário de Uso Exemplo

> **Usuário:** "Quero vender mais consultas essa semana."
>
> **CampaignOS:** "Ok! Já conheço sua clínica (Business DNA). Para vender consultas, sugiro uma **Estratégia de Autoridade + Escassez**.
>
> **Gerando...**
>
> **Resultado:**
> 1. **Post (Segunda):** Foto atendendo + Texto sobre a importância do checkup.
> 2. **WhatsApp (Quarta):** 'Abri 3 horários extras na agenda'.
> 3. **Story (Sexta):** Repost de paciente feliz.

Tudo conectado, mesma narrativa, canais diferentes.
