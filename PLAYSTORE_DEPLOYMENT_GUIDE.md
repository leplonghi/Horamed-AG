# 📱 Guia Completo de Publicação na Google Play Store - HoraMed

> **Guia Didático Passo a Passo** - Atualizado em 02/02/2026  
> **Status Atual**: Versão 1.0.5 (versionCode 5)

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Preparação do Ambiente](#2-preparação-do-ambiente)
3. [Configuração de Assinatura Digital](#3-configuração-de-assinatura-digital)
4. [Build de Produção](#4-build-de-produção)
5. [Criação da Conta de Desenvolvedor](#5-criação-da-conta-de-desenvolvedor)
6. [Preparação de Assets](#6-preparação-de-assets)
7. [Configuração do App na Play Console](#7-configuração-do-app-na-play-console)
8. [Upload do APK/AAB](#8-upload-do-apkaab)
9. [Testes e Validação](#9-testes-e-validação)
10. [Publicação](#10-publicação)
11. [Pós-Publicação](#11-pós-publicação)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Pré-requisitos

### ✅ Checklist de Ferramentas

- [ ] **Node.js** (v18+) instalado
- [ ] **Java Development Kit (JDK)** 17 ou superior
- [ ] **Android Studio** (última versão estável)
- [ ] **Android SDK** instalado via Android Studio
- [ ] **Gradle** (instalado automaticamente pelo Android Studio)
- [ ] **Git** para controle de versão

### 🔍 Verificar Instalações

```bash
# Verificar Node.js
node --version  # Deve retornar v18.x.x ou superior

# Verificar Java
java -version   # Deve retornar Java 17 ou superior

# Verificar Android SDK (após instalar Android Studio)
echo $ANDROID_HOME  # Deve retornar o caminho do SDK
```

### 📦 Instalar Android Studio

1. **Download**: [https://developer.android.com/studio](https://developer.android.com/studio)
2. **Instalação**:
   - Execute o instalador
   - Escolha "Standard Installation"
   - Aguarde o download dos componentes SDK
3. **Configurar SDK**:
   - Abra Android Studio
   - Vá em `Tools > SDK Manager`
   - Certifique-se de ter instalado:
     - ✅ Android SDK Platform 34 (ou superior)
     - ✅ Android SDK Build-Tools 34.x.x
     - ✅ Android SDK Command-line Tools

### 🌍 Configurar Variáveis de Ambiente

**Windows (PowerShell):**
```powershell
# Adicionar ao perfil do PowerShell
$env:ANDROID_HOME = "C:\Users\SeuUsuario\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"
```

**macOS/Linux:**
```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

---

## 2. Preparação do Ambiente

### 📂 Estrutura do Projeto

```
horamed/
├── android/                    # Projeto Android nativo
│   ├── app/
│   │   ├── build.gradle       # Configurações de build
│   │   └── src/
│   └── keystore/              # ⚠️ CRIAR ESTA PASTA
│       └── horamed-release.keystore  # Keystore de produção
├── capacitor.config.ts        # Configuração do Capacitor
├── package.json
└── dist/                      # Build web (gerado após npm run build)
```

### 🔧 Instalar Dependências

```bash
# 1. Instalar dependências do projeto
cd c:\Antigravity\horamed\horamed
npm install

# 2. Sincronizar Capacitor (copia arquivos web para Android)
npx cap sync android
```

---

## 3. Configuração de Assinatura Digital

### 🔐 Por que Precisamos de uma Keystore?

A Google Play Store **exige** que todos os APKs sejam assinados digitalmente. A keystore é como uma "identidade digital" do seu app. **NUNCA PERCA ESTE ARQUIVO** - sem ele, você não conseguirá atualizar o app no futuro.

### 📝 Criar Keystore de Produção

#### Passo 1: Criar a Pasta Keystore

```bash
# Criar pasta para armazenar a keystore
mkdir android\keystore
```

#### Passo 2: Gerar a Keystore

```bash
# Executar este comando na raiz do projeto
keytool -genkeypair -v -storetype PKCS12 -keystore android/keystore/horamed-release.keystore -alias horamed-key -keyalg RSA -keysize 2048 -validity 10000
```

**O que cada parâmetro significa:**
- `-storetype PKCS12`: Formato moderno de keystore
- `-keystore android/keystore/horamed-release.keystore`: Caminho onde será salva
- `-alias horamed-key`: Nome da chave (deve corresponder ao `build.gradle`)
- `-keyalg RSA`: Algoritmo de criptografia
- `-keysize 2048`: Tamanho da chave (segurança)
- `-validity 10000`: Validade em dias (~27 anos)

#### Passo 3: Preencher Informações

O comando acima vai pedir várias informações. **Exemplo de preenchimento:**

```
Enter keystore password: [CRIE UMA SENHA FORTE - ANOTE EM LOCAL SEGURO]
Re-enter new password: [REPITA A SENHA]

What is your first and last name?
  [Unknown]:  Leonardo Plonghi

What is the name of your organizational unit?
  [Unknown]:  HoraMed Development

What is the name of your organization?
  [Unknown]:  HoraMed

What is the name of your City or Locality?
  [Unknown]:  São Paulo

What is the name of your State or Province?
  [Unknown]:  SP

What is the two-letter country code for this unit?
  [Unknown]:  BR

Is CN=Leonardo Plonghi, OU=HoraMed Development, O=HoraMed, L=São Paulo, ST=SP, C=BR correct?
  [no]:  yes

Enter key password for <horamed-key>
	(RETURN if same as keystore password): [PRESSIONE ENTER]
```

#### Passo 4: Configurar Variável de Ambiente

**⚠️ IMPORTANTE**: A senha da keystore deve ser armazenada como variável de ambiente, **NUNCA** no código.

**Windows (PowerShell - Permanente):**
```powershell
# Adicionar ao perfil do PowerShell
[System.Environment]::SetEnvironmentVariable('HORAMED_KEYSTORE_PASSWORD', 'SUA_SENHA_AQUI', 'User')

# Verificar
$env:HORAMED_KEYSTORE_PASSWORD
```

**macOS/Linux:**
```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
export HORAMED_KEYSTORE_PASSWORD="SUA_SENHA_AQUI"

# Aplicar mudanças
source ~/.bashrc  # ou source ~/.zshrc

# Verificar
echo $HORAMED_KEYSTORE_PASSWORD
```

#### Passo 5: Backup da Keystore

**🚨 CRÍTICO - FAÇA BACKUP AGORA:**

1. Copie `android/keystore/horamed-release.keystore` para:
   - ✅ Google Drive / OneDrive (criptografado)
   - ✅ Pendrive em local seguro
   - ✅ Gerenciador de senhas (1Password, Bitwarden)

2. Anote a senha em local seguro:
   - ✅ Gerenciador de senhas
   - ✅ Cofre físico

**❌ NUNCA:**
- Commitar a keystore no Git
- Compartilhar a senha por email/chat
- Armazenar apenas em um local

---

## 4. Build de Produção

### 🏗️ Processo de Build Completo

#### Passo 1: Build do Frontend (Web)

```bash
# 1. Limpar builds anteriores
rm -rf dist

# 2. Build de produção
npm run build

# 3. Verificar se a pasta dist foi criada
ls dist  # Deve mostrar index.html, assets/, etc.
```

**O que acontece:**
- Vite compila o código React/TypeScript
- Otimiza e minifica arquivos
- Gera bundle final na pasta `dist/`

#### Passo 2: Sincronizar com Android

```bash
# Copiar arquivos web para o projeto Android
npx cap sync android
```

**O que acontece:**
- Copia conteúdo de `dist/` para `android/app/src/main/assets/public/`
- Atualiza plugins Capacitor
- Sincroniza configurações

#### Passo 3: Abrir no Android Studio

```bash
# Abrir projeto Android no Android Studio
npx cap open android
```

**Aguarde:** Android Studio vai indexar o projeto (pode levar alguns minutos na primeira vez).

#### Passo 4: Verificar Configurações no Android Studio

1. **Verificar Gradle Sync:**
   - Aguarde a mensagem "Gradle sync finished" no canto inferior
   - Se houver erros, clique em "Try Again"

2. **Verificar Build Variant:**
   - Menu: `Build > Select Build Variant`
   - Selecione: **release**

3. **Verificar Keystore:**
   - Abra: `android/app/build.gradle`
   - Confirme que as linhas 20-26 estão corretas:
   ```gradle
   signingConfigs {
       release {
           storeFile file('../keystore/horamed-release.keystore')
           storePassword System.getenv("HORAMED_KEYSTORE_PASSWORD")
           keyAlias 'horamed-key'
           keyPassword System.getenv("HORAMED_KEYSTORE_PASSWORD")
       }
   }
   ```

#### Passo 5: Gerar AAB (Android App Bundle)

**O que é AAB?**
- Formato moderno exigido pela Play Store desde 2021
- Mais eficiente que APK (Google gera APKs otimizados por dispositivo)
- Reduz tamanho do download em até 35%

**Gerar AAB:**

```bash
# Opção 1: Via linha de comando (recomendado)
cd android
./gradlew bundleRelease

# Opção 2: Via Android Studio
# Menu: Build > Generate Signed Bundle / APK > Android App Bundle > Next
# Selecione a keystore criada anteriormente
```

**Localização do AAB gerado:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

#### Passo 6: Verificar o AAB

```bash
# Verificar tamanho (deve ser < 150MB)
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Verificar assinatura
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

**Saída esperada:**
```
jar verified.
```

---

## 5. Criação da Conta de Desenvolvedor

### 💳 Registro na Google Play Console

#### Passo 1: Acessar Play Console

1. Acesse: [https://play.google.com/console](https://play.google.com/console)
2. Faça login com sua conta Google (recomendado: conta empresarial)

#### Passo 2: Pagar Taxa de Registro

- **Custo**: USD $25 (pagamento único, vitalício)
- **Métodos**: Cartão de crédito/débito
- **Tempo de processamento**: Instantâneo a 48h

#### Passo 3: Preencher Informações da Conta

**Tipo de Conta:**
- [ ] **Individual** (pessoa física)
- [ ] **Organização** (empresa - requer documentação adicional)

**Informações Obrigatórias:**
- Nome completo / Nome da empresa
- Endereço completo
- Telefone de contato
- Email de contato (será público na Play Store)
- Site (opcional, mas recomendado)

#### Passo 4: Aceitar Termos

- [ ] Acordo de Distribuição do Desenvolvedor
- [ ] Políticas do Programa para Desenvolvedores
- [ ] Leis de exportação dos EUA

---

## 6. Preparação de Assets

### 🎨 Assets Obrigatórios

#### 📱 Ícone do App

**Especificações:**
- **Tamanho**: 512x512 pixels
- **Formato**: PNG (32-bit)
- **Fundo**: Opaco (sem transparência)
- **Conteúdo**: Deve ocupar 80% da área (deixar margem de segurança)

**Localização no projeto:**
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png       (72x72)
├── mipmap-mdpi/ic_launcher.png       (48x48)
├── mipmap-xhdpi/ic_launcher.png      (96x96)
├── mipmap-xxhdpi/ic_launcher.png     (144x144)
└── mipmap-xxxhdpi/ic_launcher.png    (192x192)
```

**Gerar ícones automaticamente:**
```bash
# Usar ferramenta online (recomendado)
# https://icon.kitchen/

# Ou usar Android Studio:
# File > New > Image Asset > Launcher Icons (Adaptive and Legacy)
```

#### 🖼️ Feature Graphic (Banner)

**Especificações:**
- **Tamanho**: 1024x500 pixels
- **Formato**: PNG ou JPEG
- **Uso**: Aparece no topo da página do app na Play Store

**Dicas de Design:**
- Use cores do branding (#0ea5e9 - azul HoraMed)
- Inclua logo + slogan
- Evite texto pequeno (difícil de ler em mobile)
- Teste em diferentes tamanhos de tela

#### 📸 Screenshots (Capturas de Tela)

**Obrigatório:**
- **Mínimo**: 2 screenshots
- **Recomendado**: 4-8 screenshots
- **Tamanho**: 1080x1920 (portrait) ou 1920x1080 (landscape)
- **Formato**: PNG ou JPEG

**Tipos de Screenshots:**
1. **Tela de Login/Onboarding**
2. **Dashboard Principal**
3. **Funcionalidade Chave #1** (ex: Adicionar Medicamento)
4. **Funcionalidade Chave #2** (ex: Histórico de Doses)
5. **Funcionalidade Chave #3** (ex: Relatórios)
6. **Tela de Configurações/Perfil**

**Como Capturar:**

```bash
# Opção 1: Emulador Android Studio
# 1. Executar app no emulador
# 2. Usar ferramenta de screenshot do emulador (ícone de câmera)

# Opção 2: Dispositivo físico
# 1. Conectar via USB
# 2. Ativar "Depuração USB" nas Opções do Desenvolvedor
# 3. Usar Android Studio Device Manager > Screenshot
```

#### 🎥 Vídeo Promocional (Opcional)

**Especificações:**
- **Duração**: 30 segundos a 2 minutos
- **Formato**: YouTube (upload e cole o link)
- **Conteúdo**: Demonstração das funcionalidades principais

---

## 7. Configuração do App na Play Console

### 🚀 Criar Novo App

#### Passo 1: Criar App

1. Acesse: [Play Console](https://play.google.com/console) > **Criar app**
2. Preencha:
   - **Nome do app**: HoraMed
   - **Idioma padrão**: Português (Brasil)
   - **Tipo de app**: App
   - **Gratuito ou pago**: Gratuito
   - **Declarações**:
     - [ ] Este app está em conformidade com as Políticas do Programa
     - [ ] Este app está em conformidade com as leis dos EUA

#### Passo 2: Configurar Painel Principal

**Dashboard > Configurar seu app**

Você verá várias tarefas obrigatórias. Vamos preencher cada uma:

---

### 📝 Tarefa 1: Privacidade do App

#### 1.1 Política de Privacidade

- **URL da Política**: `https://horamed.app/privacy` (ou onde estiver hospedada)
- **Obrigatório**: Sim

**⚠️ Se você ainda não tem:**
1. Crie uma página de Política de Privacidade
2. Hospede no Firebase Hosting ou site institucional
3. Deve incluir:
   - Quais dados são coletados (email, dados de saúde, etc.)
   - Como são usados
   - Como são armazenados (Firebase)
   - Direitos do usuário (LGPD/GDPR)

#### 1.2 Segurança de Dados

**Preencher formulário:**

1. **Coleta de dados:**
   - [ ] Sim, coletamos dados pessoais

2. **Tipos de dados coletados:**
   - [x] Informações pessoais (nome, email)
   - [x] Informações de saúde (medicamentos, horários)
   - [x] Arquivos e documentos (fotos de perfil)

3. **Uso de dados:**
   - [x] Funcionalidade do app
   - [x] Personalização
   - [ ] Publicidade (se não usar)

4. **Compartilhamento de dados:**
   - [ ] Não compartilhamos dados com terceiros
   - [x] Compartilhamos com provedores de serviço (Firebase, Stripe)

5. **Segurança:**
   - [x] Dados criptografados em trânsito (HTTPS)
   - [x] Dados criptografados em repouso (Firebase)
   - [x] Usuário pode solicitar exclusão de dados

---

### 📝 Tarefa 2: Classificação de Conteúdo

1. Acesse: **Classificação de conteúdo** > **Iniciar questionário**
2. Selecione categoria: **Utilidade** ou **Saúde e fitness**
3. Responda ao questionário:
   - Violência: Não
   - Conteúdo sexual: Não
   - Linguagem imprópria: Não
   - Drogas: **Sim** (medicamentos - contexto médico)
   - Medo/horror: Não
   - Jogos de azar: Não

**Resultado esperado:** Classificação L (Livre) ou 10+

---

### 📝 Tarefa 3: Público-alvo e Conteúdo

#### 3.1 Público-alvo

- **Faixa etária principal**: 18-65+
- **Faixa etária secundária**: 13-17 (com supervisão dos pais)
- **Apelo para crianças**: Não

#### 3.2 Anúncios

- **O app contém anúncios?**: Não (se não tiver)

---

### 📝 Tarefa 4: Detalhes do App

#### 4.1 Descrição Curta (80 caracteres)

```
Organize seus medicamentos com lembretes inteligentes e histórico completo.
```

#### 4.2 Descrição Completa (4000 caracteres)

```markdown
🏥 HoraMed - Seu Assistente de Medicamentos

Nunca mais esqueça de tomar seus remédios! O HoraMed é o aplicativo completo para gerenciar sua rotina de medicamentos com facilidade e segurança.

✨ PRINCIPAIS FUNCIONALIDADES:

📋 Gerenciamento Completo
• Cadastre medicamentos com nome, dosagem e horários
• Organize por perfis familiares (você, filhos, pais)
• Adicione fotos e informações detalhadas
• Controle estoque e receba alertas de reposição

⏰ Lembretes Inteligentes
• Notificações personalizadas para cada medicamento
• Múltiplos horários por dia
• Lembretes de reabastecimento
• Funciona mesmo com o app fechado

📊 Histórico e Relatórios
• Acompanhe todas as doses tomadas
• Visualize estatísticas de adesão
• Gere relatórios em PDF para médicos
• Compartilhe histórico com profissionais de saúde

👨‍👩‍👧‍👦 Perfis Familiares
• Gerencie medicamentos de toda a família
• Alterne entre perfis facilmente
• Privacidade e segurança garantidas

🎯 Gamificação e Recompensas
• Ganhe pontos por consistência
• Desbloqueie conquistas
• Mantenha séries de dias consecutivos
• Acompanhe seu progresso

🔒 Segurança e Privacidade
• Dados criptografados
• Backup automático na nuvem
• Autenticação biométrica (impressão digital/Face ID)
• Conformidade com LGPD

💎 Plano Premium
• Perfis ilimitados
• Relatórios avançados
• Suporte prioritário
• Sem anúncios

📱 Compatibilidade
• Android 7.0 ou superior
• Interface moderna e intuitiva
• Modo escuro disponível
• Suporte a múltiplos idiomas

🌟 POR QUE ESCOLHER O HORAMED?

O HoraMed foi desenvolvido pensando em quem precisa de uma solução confiável e fácil de usar para gerenciar medicamentos. Seja para você, seus pais idosos ou seus filhos, o HoraMed garante que nenhuma dose seja esquecida.

📞 SUPORTE

Dúvidas ou sugestões? Entre em contato:
• Email: suporte@horamed.app
• Site: https://horamed.app

🔐 PRIVACIDADE

Seus dados de saúde são tratados com máxima segurança. Leia nossa Política de Privacidade em: https://horamed.app/privacy

---

Baixe agora e transforme sua rotina de medicamentos!
```

#### 4.3 Informações de Contato

- **Email**: suporte@horamed.app (ou seu email)
- **Telefone**: (opcional)
- **Site**: https://horamed.app

#### 4.4 Categoria

- **Categoria principal**: Saúde e fitness
- **Categoria secundária**: Medicina

#### 4.5 Tags (Palavras-chave)

```
medicamentos, remédios, saúde, alarme, lembrete, farmácia, dose, tratamento, prescrição, adesão
```

---

### 📝 Tarefa 5: Gráficos da Loja

1. **Ícone do app**: Upload do ícone 512x512
2. **Feature Graphic**: Upload do banner 1024x500
3. **Screenshots**:
   - Upload mínimo de 2 screenshots
   - Recomendado: 4-8 screenshots
4. **Vídeo** (opcional): Link do YouTube

---

## 8. Upload do APK/AAB

### 📦 Criar Release

#### Passo 1: Acessar Produção

1. Play Console > **Produção**
2. Clique em **Criar nova versão**

#### Passo 2: Upload do AAB

1. Clique em **Upload** (ou arraste o arquivo)
2. Selecione: `android/app/build/outputs/bundle/release/app-release.aab`
3. Aguarde upload (pode levar alguns minutos)

**Verificações automáticas:**
- ✅ Assinatura válida
- ✅ Tamanho do app
- ✅ Permissões declaradas
- ✅ Compatibilidade de dispositivos

#### Passo 3: Preencher Notas da Versão

**Português (Brasil):**
```markdown
🎉 Versão 1.0.5 - Lançamento Inicial

Bem-vindo ao HoraMed! Esta é nossa primeira versão na Play Store.

✨ Funcionalidades incluídas:
• Gerenciamento completo de medicamentos
• Lembretes inteligentes e personalizáveis
• Perfis familiares
• Histórico detalhado de doses
• Relatórios em PDF
• Gamificação e recompensas
• Autenticação biométrica
• Modo escuro

📱 Requisitos:
• Android 7.0 ou superior

💬 Feedback:
Adoraríamos ouvir sua opinião! Entre em contato: suporte@horamed.app
```

**English (US):**
```markdown
🎉 Version 1.0.5 - Initial Release

Welcome to HoraMed! This is our first version on the Play Store.

✨ Features included:
• Complete medication management
• Smart and customizable reminders
• Family profiles
• Detailed dose history
• PDF reports
• Gamification and rewards
• Biometric authentication
• Dark mode

📱 Requirements:
• Android 7.0 or higher

💬 Feedback:
We'd love to hear from you! Contact: suporte@horamed.app
```

#### Passo 4: Revisar e Salvar

1. Revise todas as informações
2. Clique em **Salvar**
3. Clique em **Revisar versão**

---

## 9. Testes e Validação

### 🧪 Teste Interno (Recomendado)

Antes de publicar para todos, teste com um grupo fechado:

#### Passo 1: Criar Faixa de Teste Interno

1. Play Console > **Teste interno**
2. Clique em **Criar nova versão**
3. Upload do mesmo AAB
4. Adicionar testadores:
   - Email dos testadores (máximo 100)
   - Ou criar lista de emails

#### Passo 2: Distribuir para Testadores

1. Copie o link de teste
2. Envie para testadores
3. Testadores devem:
   - Acessar o link
   - Aceitar convite
   - Baixar app da Play Store

#### Passo 3: Coletar Feedback

- Peça para testarem todas as funcionalidades
- Verifique relatórios de crash (se houver)
- Corrija bugs antes da publicação pública

### 🔍 Validações Automáticas da Google

A Play Console vai executar várias verificações:

1. **Análise de Segurança**
   - Malware
   - Vulnerabilidades conhecidas
   - Permissões suspeitas

2. **Análise de Privacidade**
   - Conformidade com políticas
   - Uso de dados sensíveis
   - Permissões desnecessárias

3. **Análise de Conteúdo**
   - Conteúdo proibido
   - Direitos autorais
   - Marcas registradas

**Tempo de análise:** 1-7 dias (geralmente 24-48h)

---

## 10. Publicação

### 🚀 Enviar para Revisão

#### Passo 1: Revisar Tudo

**Checklist final:**
- [ ] AAB enviado e validado
- [ ] Descrições preenchidas (PT e EN)
- [ ] Screenshots adicionados (mínimo 2)
- [ ] Ícone e Feature Graphic enviados
- [ ] Política de Privacidade configurada
- [ ] Classificação de conteúdo completa
- [ ] Público-alvo definido
- [ ] Informações de contato preenchidas
- [ ] Notas da versão escritas

#### Passo 2: Enviar para Revisão

1. Play Console > **Produção** > **Revisar versão**
2. Revise o resumo
3. Clique em **Iniciar lançamento para produção**

**Confirmação:**
```
✅ Sua versão foi enviada para revisão!
```

#### Passo 3: Aguardar Aprovação

**Timeline esperado:**
- **Análise automática**: 1-2 horas
- **Revisão manual**: 1-7 dias (média: 2-3 dias)
- **Publicação**: Após aprovação, disponível em até 2 horas

**Status possíveis:**
- 🟡 **Em revisão**: Aguardando análise
- 🟢 **Aprovado**: Publicação em andamento
- 🔴 **Rejeitado**: Veja motivos e corrija

### 📧 Notificações

Você receberá emails sobre:
- Início da revisão
- Aprovação/Rejeição
- Publicação concluída
- Problemas encontrados

---

## 11. Pós-Publicação

### 📊 Monitoramento

#### 1. Acompanhar Métricas

**Play Console > Estatísticas:**
- **Instalações**: Quantos usuários baixaram
- **Desinstalações**: Taxa de retenção
- **Avaliações**: Nota média (meta: 4.0+)
- **Comentários**: Feedback dos usuários
- **Crashes**: Relatórios de erro

#### 2. Responder Avaliações

- Responda **todas** as avaliações (especialmente negativas)
- Seja educado e profissional
- Ofereça soluções para problemas
- Agradeça feedback positivo

**Exemplo de resposta:**
```
Olá! Obrigado pelo feedback. Lamentamos o problema com [X]. 
Nossa equipe já está trabalhando em uma correção que será 
lançada na próxima atualização. Para suporte imediato, 
entre em contato: suporte@horamed.app
```

#### 3. Monitorar Crashes

**Play Console > Qualidade > Android vitals:**
- Taxa de crash (meta: < 1%)
- ANRs (App Not Responding)
- Problemas de bateria
- Problemas de renderização

**Se houver crashes:**
1. Analise stack trace
2. Reproduza o erro
3. Corrija o bug
4. Lance atualização

### 🔄 Atualizações Futuras

#### Quando Atualizar?

- **Correção de bugs críticos**: Imediatamente
- **Novos recursos**: A cada 2-4 semanas
- **Melhorias de performance**: Mensalmente
- **Atualizações de segurança**: Assim que disponíveis

#### Como Atualizar?

1. **Incrementar versionCode** em `android/app/build.gradle`:
   ```gradle
   versionCode 6  // Era 5
   versionName "1.0.6"  // Era 1.0.5
   ```

2. **Repetir processo de build:**
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew bundleRelease
   ```

3. **Upload na Play Console:**
   - Produção > Criar nova versão
   - Upload do novo AAB
   - Preencher notas da versão
   - Enviar para revisão

---

## 12. Troubleshooting

### ❌ Problemas Comuns

#### Erro: "Keystore not found"

**Causa:** Caminho da keystore incorreto ou arquivo não existe.

**Solução:**
```bash
# Verificar se o arquivo existe
ls android/keystore/horamed-release.keystore

# Se não existir, criar novamente (Seção 3)
```

#### Erro: "Incorrect keystore password"

**Causa:** Variável de ambiente não configurada ou senha incorreta.

**Solução:**
```bash
# Verificar variável de ambiente
echo $HORAMED_KEYSTORE_PASSWORD  # macOS/Linux
$env:HORAMED_KEYSTORE_PASSWORD   # Windows

# Se vazio, configurar novamente (Seção 3, Passo 4)
```

#### Erro: "App not signed"

**Causa:** Build variant errado (debug ao invés de release).

**Solução:**
1. Android Studio > Build > Select Build Variant
2. Selecione: **release**
3. Rebuild: `./gradlew bundleRelease`

#### Erro: "Duplicate resources"

**Causa:** Arquivos duplicados em `android/app/src/main/res/`.

**Solução:**
```bash
# Limpar build
cd android
./gradlew clean

# Rebuild
./gradlew bundleRelease
```

#### Erro: "App Bundle contains code that is not optimized"

**Causa:** ProGuard/R8 não está minificando corretamente.

**Solução:**
Verifique `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true  // Deve estar true
        shrinkResources true  // Deve estar true
    }
}
```

#### Erro: "Play Console - App rejected"

**Causas comuns:**
1. **Política de Privacidade ausente/inválida**
   - Solução: Criar/atualizar política e reenviar

2. **Permissões não justificadas**
   - Solução: Remover permissões desnecessárias ou justificar uso

3. **Conteúdo proibido**
   - Solução: Revisar descrições e screenshots

4. **Ícone de baixa qualidade**
   - Solução: Redesenhar ícone seguindo Material Design

#### Erro: "Firebase not working in production"

**Causa:** Configuração de desenvolvimento no `capacitor.config.ts`.

**Solução:**
Certifique-se de que `server.url` está comentado:
```typescript
// server: {
//   url: 'https://...',
// },
```

#### App muito grande (> 150MB)

**Soluções:**
1. **Ativar App Bundle** (já está ativado)
2. **Remover assets não utilizados:**
   ```bash
   # Analisar tamanho
   npx cap copy android
   cd android
   ./gradlew app:dependencies
   ```
3. **Otimizar imagens:**
   - Usar WebP ao invés de PNG/JPEG
   - Comprimir imagens
4. **Code splitting** no Vite

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)

### Ferramentas Úteis

- **Icon Generator**: [https://icon.kitchen/](https://icon.kitchen/)
- **Screenshot Generator**: [https://screenshots.pro/](https://screenshots.pro/)
- **App Size Analyzer**: Android Studio > Build > Analyze APK

### Comunidade

- [Stack Overflow - Android](https://stackoverflow.com/questions/tagged/android)
- [Capacitor Community Discord](https://discord.gg/UPYYRhtyzp)
- [r/androiddev](https://reddit.com/r/androiddev)

---

## ✅ Checklist Final de Publicação

Antes de enviar para revisão, confirme:

### Técnico
- [ ] AAB gerado com sucesso
- [ ] AAB assinado com keystore de produção
- [ ] Backup da keystore feito (3 locais diferentes)
- [ ] `webContentsDebuggingEnabled: false` no `capacitor.config.ts`
- [ ] `server.url` comentado no `capacitor.config.ts`
- [ ] versionCode e versionName corretos
- [ ] App testado em dispositivo físico
- [ ] App testado em emulador
- [ ] Todas as funcionalidades funcionando
- [ ] Sem crashes ou erros críticos

### Play Console
- [ ] Conta de desenvolvedor criada e paga
- [ ] App criado na Play Console
- [ ] Descrição curta preenchida (PT e EN)
- [ ] Descrição completa preenchida (PT e EN)
- [ ] Ícone 512x512 enviado
- [ ] Feature Graphic 1024x500 enviado
- [ ] Mínimo 2 screenshots enviados
- [ ] Política de Privacidade configurada
- [ ] Classificação de conteúdo completa
- [ ] Público-alvo definido
- [ ] Categoria selecionada
- [ ] Informações de contato preenchidas
- [ ] Segurança de dados declarada
- [ ] Notas da versão escritas

### Legal
- [ ] Política de Privacidade publicada
- [ ] Termos de Uso publicados (se aplicável)
- [ ] Conformidade com LGPD verificada
- [ ] Conformidade com GDPR verificada (se for distribuir na Europa)
- [ ] Direitos autorais de imagens/ícones verificados

---

## 🎉 Conclusão

Parabéns por chegar até aqui! Publicar um app na Play Store é um processo detalhado, mas seguindo este guia passo a passo, você conseguirá fazer isso com sucesso.

**Próximos passos após publicação:**
1. Compartilhe o link da Play Store nas redes sociais
2. Peça para amigos/família avaliarem (5 estrelas! ⭐)
3. Monitore feedback e responda comentários
4. Planeje próximas atualizações
5. Considere estratégias de marketing (ASO - App Store Optimization)

**Lembre-se:**
- A primeira aprovação pode demorar até 7 dias
- Atualizações futuras são mais rápidas (1-2 dias)
- Mantenha backups da keystore em local seguro
- Responda sempre aos usuários

Boa sorte com o lançamento do HoraMed! 🚀

---

**Documentado por:** Leonardo Plonghi  
**Data:** 02/02/2026  
**Versão do Guia:** 1.0  
**App Version:** 1.0.5 (versionCode 5)
