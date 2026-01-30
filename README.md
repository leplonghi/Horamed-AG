# HoraMed - Seu Assistente de Saúde Pessoal 🏥

## 📱 Sobre o Projeto

HoraMed é um aplicativo de saúde completo que ajuda você a gerenciar medicamentos, consultas, exames e muito mais. Desenvolvido com tecnologias modernas para oferecer a melhor experiência ao usuário.

## 🚀 Repositório

**GitHub**: https://github.com/leplonghi/horamed-AG

## 🛠️ Tecnologias

Este projeto utiliza as seguintes tecnologias:

- **React** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **Firebase** - Backend (Firestore, Storage, Auth, Functions)
- **Capacitor** - Build mobile (iOS/Android)
- **React Router** - Navegação
- **React Query** - Gerenciamento de estado
- **Framer Motion** - Animações

## 💻 Desenvolvimento Local

### Pré-requisitos

- Node.js (versão LTS recomendada) - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm ou yarn

### Instalação

```sh
# 1. Clone o repositório
git clone https://github.com/leplonghi/horamed-AG.git

# 2. Entre no diretório
cd horamed

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080`

### Scripts Disponíveis

```sh
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run build:dev        # Build de desenvolvimento
npm run preview          # Preview do build
npm run lint             # Executa linter
```

### Scripts de Migração (Firebase)

```sh
npm run migrate:export   # Exporta dados do Supabase
npm run migrate:import   # Importa dados para Firebase
npm run migrate:storage  # Migra arquivos de storage
npm run migrate:full     # Execução completa da migração
```

### Scripts Firebase

```sh
npm run firebase:deploy              # Deploy completo
npm run firebase:deploy:rules        # Deploy apenas das regras
```

## 📦 Build Mobile

```sh
# iOS
npx cap sync ios
npx cap open ios

# Android
npx cap sync android
npx cap open android
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Stripe (opcional)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 🐛 Solução de Problemas

### Erro: Cannot find module @rollup/rollup-[os-arch]

**Solução 1: Limpar cache e reinstalar**
```sh
rm -rf node_modules
rm package-lock.json
npm install
```

**Solução 2: Instalar o binário específico do Rollup**
```sh
npm install @rollup/rollup-[your-os-arch]
```

Substitua `[your-os-arch]` pela arquitetura do seu sistema (ex: `linux-x64`, `darwin-arm64`, `win32-x64`).

**Solução 3: Usar versão LTS do Node.js**

Certifique-se de estar usando uma versão LTS do Node.js.

## 📝 Estrutura do Projeto

```
horamed/
├── src/
│   ├── components/      # Componentes React
│   ├── pages/          # Páginas/Rotas
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e helpers
│   ├── integrations/   # Integrações (Firebase, etc)
│   └── contexts/       # Context providers
├── public/             # Arquivos estáticos
├── functions/          # Firebase Cloud Functions
└── docs/              # Documentação
```

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir, entre em contato com o mantenedor.

## 📄 Licença

Todos os direitos reservados © 2026 HoraMed

## 📧 Contato

Para dúvidas ou suporte, entre em contato através do repositório GitHub.
