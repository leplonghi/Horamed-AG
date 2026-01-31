# Antigravity.md - Contexto de Workflows n8n

> Este arquivo define o contexto, diretrizes e conhecimentos para a criação de fluxos de trabalho no n8n pelo Agente Antigravity.

---

## 🎯 Objetivo Principal
Criar, otimizar e documentar fluxos de trabalho no **n8n** com qualidade de nível especialista, utilizando o servidor MCP e as Skills oficiais.

---

## 🧠 Princípios Fundamentais (Antigravity Protocol)
Baseado na documentação oficial `n8n-mcp` para Antigravity:

1.  **Execução Silenciosa & Paralela:** Executar ferramentas de busca e validação em paralelo e informar apenas o resultado consolidado.
2.  **Templates Primeiro:** Sempre verificar a existência de templates (`search_templates`) antes de criar do zero (2,700+ disponíveis).
3.  **Validação Multi-Nível:**
    *   Nível 1: Checagem rápida (`validate_node mode='minimal'`)
    *   Nível 2: Validação completa (`validate_node mode='full'`)
    *   Nível 3: Validação do fluxo (`validate_workflow`)
4.  **Desconfie dos Padrões (Defaults):** Nunca confiar em valores padrão. Configurar EXPLICITAMENTE todos os parâmetros críticos.
5.  **Atribuição Obrigatória:** Ao usar templates, creditar o autor original.

---

## 🛠️ Ferramentas & Capacidades (MCP)
Quando o servidor `n8n-mcp` estiver ativo, teremos acesso a:

### Busca & Descoberta
*   `search_templates`: Encontrar fluxos prontos por tarefa, metadados ou nós.
*   `search_nodes`: Buscar nós disponíveis (Community ou Verified).
*   `get_node`: Obter detalhes, documentação e exemplos de configuração de um nó.
*   `tools_documentation`: Acessar documentação de qualquer ferramenta MCP.

### Gerenciamento de Workflows
*   `n8n_create_workflow` / `n8n_update_partial_workflow`: Criar e atualizar fluxos.
*   `n8n_test_workflow`: Testar execuções (dispara webhooks/chats).
*   `n8n_executions`: Gerenciar histórico de execuções.
*   `n8n_autofix_workflow`: Tentar corrigir erros comuns automaticamente.

### Validação
*   `validate_node`: Validar configurações de nós individuais.
*   `validate_workflow`: Validar a integridade lógica de todo o fluxo.

---

## 📚 Skills do n8n (Conhecimento Aplicado)
Incorporaremos as melhores práticas das 7 Skills oficiais:

1.  **Sintaxe de Expressões:** Uso correto de `{{ $json.body }}` e variáveis `$node`.
2.  **MCP Tools Expert:** Uso eficiente das ferramentas de busca e validação.
3.  **Padrões de Workflow:** Aplicação de 5 padrões arquiteturais comprovados (Webhook, API, Banco de Dados, IA, Agendado).
4.  **Especialista em Validação:** Interpretação de erros e correções guiadas.
5.  **Configuração de Nós:** Dependências de propriedades e tipos de conexão de IA.
6.  **JavaScript (Code Node):** Padrões de acesso a dados (`$input.all()`) e retorno (`[{json: ...}]`).
7.  **Python (Code Node):** Uso consciente das limitações (sem libs externas) e acesso a dados.

---

## 🚀 Checklist de Ativação (Para o Usuário)
Para habilitar estas capacidades, siga estes passos (do `ANTIGRAVITY_SETUP.md`):

1.  **Instalar Globalmente:** `npm install -g n8n-mcp`
2.  **Adicionar ao Cursor/Antigravity:**
    *   Edite `C:\Users\<SEU_USUARIO>\.gemini\antigravity\mcp_config.json`.
    *   Adicione a configuração do `n8n-mcp` apontando para o seu `index.js`.
    *   Configure as variáveis de ambiente:
        ```json
        "env": {
          "N8N_API_URL": "http://localhost:5678", // ou sua URL de produção
          "N8N_API_KEY": "SUA_API_KEY_AQUI"
        }
        ```
3.  **Reiniciar MCP:** Recarregue os servidores MCP no seu editor.

---

## 📝 Registro de Workflows (Planejamento)

| ID | Nome do Workflow | Status | Descrição |
| :--- | :--- | :--- | :--- |
| 001 | [Exemplo] Onboarding | Pendente | Envio de email e CRM |

---
*Este arquivo é o guia mestre para nossas automações.*
