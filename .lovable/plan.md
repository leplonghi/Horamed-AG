
# Plano: Reescrever Guia de Submissão da Play Store

## Objetivo
Reescrever o arquivo `PLAYSTORE_SUBMISSION.md` tornando-o mais didático, detalhado e amigável para desenvolvedores que podem não ter experiência com builds Android nativos.

## Principais Melhorias

### 1. Estrutura Reorganizada
- Adicionar seção de **Pré-requisitos** com checklist do que precisa estar instalado
- Separar claramente as fases: Preparação, Configuração, Build e Publicação
- Usar numeração clara e consistente (1.1, 1.2, 1.3...)

### 2. Explicações Contextuais
- Adicionar **"Por que isso?"** em cada passo importante
- Explicar o que cada comando faz, não apenas listar comandos
- Incluir avisos de segurança (ex: nunca commitar senhas)

### 3. Passo a Passo Visual
- Usar emojis/ícones para indicar tipos de ação (terminal, edição de arquivo, verificação)
- Adicionar screenshots fictícios ou descrições do que esperar ver
- Incluir "checkpoints" - como saber se o passo funcionou

### 4. Seção de Troubleshooting Expandida
- Mais erros comuns documentados
- Mensagens de erro exatas que o desenvolvedor verá
- Soluções alternativas quando a primeira não funcionar

## Mudanças Detalhadas

### Nova Seção: Pré-requisitos
```text
## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [ ] Node.js 18+ (verificar: node --version)
- [ ] Android Studio (com SDK Platform 35)
- [ ] Java 17+ (verificar: java --version)
- [ ] Git (verificar: git --version)
```

### Novo Passo 1: Configurar Ambiente
- Verificar instalações com comandos de teste
- Configurar JAVA_HOME e ANDROID_HOME
- Testar se `gradlew` funciona

### Novo Passo 2: Gerar Keystore (Expandido)
- Explicar o que é um keystore e por que é importante
- Comando detalhado com explicação de cada parâmetro
- Onde guardar a senha de forma segura
- Aviso: NUNCA perca o keystore!

### Novo Passo 3: Preparar Projeto Web
- Explicar que o Capacitor empacota o site como app
- Verificar se npm install funcionou
- Verificar se npm run build gerou a pasta dist/

### Novo Passo 4: Criar Projeto Android
- Diferenciar `cap add` (primeira vez) vs `cap sync` (atualização)
- Verificar estrutura de pastas criada
- Listar arquivos que devem existir

### Novo Passo 5: Configurar Gradle (Muito Expandido)
- Explicar a arquitetura de arquivos Gradle
- Mostrar exatamente onde adicionar cada configuração
- Incluir arquivo completo, não apenas snippets
- Marcar com comentários o que foi alterado

### Novo Passo 6: Configurar Assinatura
- Onde colocar o arquivo keystore
- Como configurar as senhas (e alternativas seguras)
- Verificar se a assinatura está correta

### Novo Passo 7: Executar Build
- Comandos separados com explicação
- O que fazer se demorar muito
- Onde encontrar o arquivo final

### Novo Passo 8: Verificar Build
- Como testar o AAB antes de enviar
- Instalar em dispositivo físico (bundletool)
- Verificar tamanho do arquivo

## Seção Técnica

### Arquivos que serão modificados:
- `PLAYSTORE_SUBMISSION.md` - Reescrita completa

### Estrutura proposta do novo documento:

```text
# HoraMed - Guia Completo de Publicação na Play Store

## Parte 1: Preparação do Ambiente
  1.1 Requisitos de Software
  1.2 Verificar Instalações
  1.3 Configurar Variáveis de Ambiente

## Parte 2: Criar Keystore de Assinatura
  2.1 O que é um Keystore?
  2.2 Gerar o Keystore
  2.3 Guardar Credenciais com Segurança

## Parte 3: Preparar o Projeto
  3.1 Atualizar Dependências
  3.2 Build do Frontend
  3.3 Criar Projeto Android

## Parte 4: Configurar Arquivos do Gradle
  4.1 Entendendo a Estrutura
  4.2 Verificar variables.gradle
  4.3 Configurar build.gradle (raiz)
  4.4 Configurar app/build.gradle
  4.5 Adicionar Assinatura de Release

## Parte 5: Gerar o Build de Release
  5.1 Limpar Builds Anteriores
  5.2 Gerar AAB
  5.3 Localizar Arquivo Final

## Parte 6: Testar Antes de Enviar
  6.1 Verificar Tamanho do AAB
  6.2 Instalar em Dispositivo (Opcional)

## Parte 7: Publicar na Play Store
  7.1 Criar Conta de Desenvolvedor
  7.2 Criar Ficha do App
  7.3 Enviar o AAB
  7.4 Preencher Data Safety
  7.5 Submeter para Revisão

## Troubleshooting
  - Erro: Could not find property
  - Erro: Namespace not specified
  - Erro: applicationId diferente
  - Erro: Keystore not found
  - Erro: Java version incompatible

## Referências e Links
```

### Tamanho estimado:
- Documento atual: ~310 linhas
- Documento novo: ~500-600 linhas (mais detalhado)

### Tempo de implementação:
- Reescrita completa do documento em uma única edição
