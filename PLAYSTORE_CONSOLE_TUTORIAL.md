# 🎮 Guia Visual: Google Play Console - Passo a Passo

Este guia é focado **100% no site do Google Play Console**. Esqueça código e terminal. Aqui é só clicar e preencher.

---

## 🏗️ FASE 1: Criando o App

1.  Acesse: [play.google.com/console](https://play.google.com/console)
2.  Clique no botão azul **"Criar app"** (canto superior direito).
3.  Preencha:
    *   **Nome do App**: `HoraMed`
    *   **Idioma padrão**: `Português (Brasil)`
    *   **App ou Jogo**: `App`
    *   **Gratuito ou Pago**: `Gratuito` (Cuidado: essa escolha é permanente!)
4.  Marque as duas caixas de "Declarações" (Leis de exportação e Diretrizes).
5.  Clique em **"Criar app"**.

---

## 📋 FASE 2: Configuração Inicial (O Painel)

Você cairá no **Painel (Dashboard)**. Role para baixo até encontrar a seção **"Configurar o app"**.
O Google exige que você complete **todas** as tarefas desta lista.

### 1. Política de Privacidade
*   **Ação**: Clique em "Definir política de privacidade".
*   **O que colar**: `https://horamed.app/privacidade`
*   **Salvar** e voltar ao Painel.

### 2. Acesso ao App
*   **Pergunta**: O Google pode acessar tudo ou precisa de senha?
*   **Selecione**: "Todas as funcionalidades estão disponíveis sem acesso especial" (Se o app permitir uso básico sem login) **OU** "Todas ou algumas funcionalidades são restritas".
*   *Dica: Se precisar de login, crie um usuário de teste (ex: `teste@horamed.app` / `senha123`) e forneça aqui.*

### 3. Anúncios
*   **Pergunta**: O app tem propaganda?
*   **Selecione**: "Não, meu app não contém anúncios".

### 4. Classificação de Conteúdo (Questionário)
*   Clique em "Iniciar questionário".
*   **Categoria**: "Referência, Notícias ou Educacional" (ou Utilitários).
*   **Perguntas**: Responda honestamente "Não" para violência, sexo, drogas, etc.
*   **Resultado esperado**: Classificação "Livre" ou "3+".

### 5. Público-Alvo
*   **Selecione**: "18 anos ou mais" (Mais seguro para aprovação rápida).
*   **Apeal to children?**: "Não" (Não é projetado para crianças).

### 6. Apps de Notícias
*   **Selecione**: "Não".

### 7. COVID-19
*   **Selecione**: "Meu app não é um app de rastreamento...".

### 8. Segurança de Dados (MUITO IMPORTANTE) ⚠️
Aqui você declara o que coleta. Como o HoraMed usa Firebase/Supabase:
1.  **Coleta dados?**: Sim.
2.  **Criptografado?**: Sim.
3.  **Pode excluir?**: Sim.
4.  **Tipos de dados**:
    *   *Informações Pessoais*: Nome, Email (se tiver login).
    *   *Saúde*: Informações de Saúde e Medicamentos (Marque "Saúde e Fitness").
    *   *App Info*: Logs de falhas (Firebase Analytics).

### 9. App Governamental
*   **Selecione**: "Não".

### 10. Categoria e Contato
*   **Categoria**: `Medicina` ou `Saúde e Fitness`.
*   **Tags**: Adicione tags como "Medicamentos", "Saúde", "Lembrete".
*   **Email**: `suporte@horamed.app` (ou seu email pessoal).

---

## 🎨 FASE 3: A Loja (Store Listing)

Agora vamos deixar a página bonita. No menu lateral esquerdo, vá em **"Presença na Loja" > "Página principal..."**.

### 1. Textos (Copie do `PLAYSTORE_TEMPLATES.md`)
*   **Nome do App**: HoraMed
*   **Breve descrição**: (Copie a frase curta do arquivo de templates)
*   **Descrição completa**: (Copie o texto longo do arquivo de templates)

### 2. Gráficos (Assets)
*   **Ícone do App**: Arraste a imagem 512x512 png.
*   **Recurso gráfico (Feature Graphic)**: Arraste a imagem 1024x500 png.
*   **Screenshots (Celular)**: Arraste de 2 a 8 prints da tela do app.
    *   *Dica: Você precisa de pelo menos 2.*

---

## 🚀 FASE 4: O Lançamento (Release)

Agora, o passo final onde deu erro antes.

1.  No menu lateral esquerdo, vá em **"Testar e lançar" > "Produção"**.
    *   *Dica: Se quiser testar antes, vá em "Teste fechado", mas para lançar direto, vá em Produção.*
2.  Clique em **"Criar nova versão"**.
3.  **Assinatura de Apps (Play App Signing)**: Clique em "Continuar" ou "Escolher chave de assinatura" > "Usar chave gerada pelo Google".
4.  **Pacotes de App (Onde você arrasta o arquivo)**:
    *   Localize o arquivo que geramos: `android/app/build/outputs/bundle/release/app-release.aab`
    *   Arraste para a área de upload.
    *   **Sucesso**: Ele vai mostrar "Versão 6 (1.0.6)".
5.  **Nome da versão**: `1.0.6 Release`
6.  **Notas da versão**:
    ```text
    Lançamento oficial do HoraMed!
    - Controle seus medicamentos
    - Gerencie estoques
    - Cuide da sua saúde
    ```
7.  Clique em **"Próximo"**.

### A Revisão Final
Você verá uma tela de resumo.
*   Se houver **Erros (Vermelhos)**: Você não consegue publicar. Leia o erro e corrija.
*   Se houver **Avisos (Amarelos)**: Pode ignorar e publicar.

Clique em **"Salvar"** e depois **"Enviar para revisão"**.

---

## ⏳ FASE 5: A Espera

Agora está com o Google.
*   **Status**: Mudará para "Em análise".
*   **Tempo**: Apps novos levam de **1 a 7 dias** (geralmente 3 dias).
*   **Resultado**: Você receberá um email quando for aprovado (Production) ou se precisarem de mais correções.

---

### 🆘 Erros Comuns no Console

| Erro | Solução |
|------|---------|
| "O pacote de app tem uma versão incorreta" | Você tentou enviar a versão 5 de novo. Gere a versão 7 no código. |
| "A chave de assinatura é diferente" | Você perdeu a Keystore original. (Não perca `horamed-release.keystore`!) |
| "Política de Privacidade inválida" | Verifique se o link abre no navegador sem login. |
| "Precisa preencher Segurança de Dados" | Você pulou a Fase 2, passo 8. Volte lá. |

**Boa sorte! 🚀**
