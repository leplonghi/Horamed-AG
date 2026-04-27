# Deploy do HoraMed para Firebase

Guia operacional passo a passo para fazer o deploy do HoraMed no Firebase.

---

## Estado do projeto (verificado em 27/04/2026)

O projeto **já está configurado** para Firebase:

| Item | Valor |
|---|---|
| Project ID | `horamed-firebase` (em `.firebaserc`) |
| Hosting | `dist/` → SPA com fallback para `index.html` |
| Functions | `functions/` com build TypeScript (`tsc` → `lib/`) |
| Firestore | `firestore.rules` + `firestore.indexes.json` |
| Storage | `storage.rules` |
| Stack web | Vite 5 + React 18 |
| Node alvo (Functions) | v22 |

Scripts úteis em `package.json`:

```bash
npm run build                # Build do front (Vite → dist/)
npm run firebase:deploy      # Deploy de tudo (firebase deploy)
npm run firebase:deploy:rules  # Deploy só das rules (firestore + storage)
```

Scripts em `functions/package.json`:

```bash
npm run build    # Compila TypeScript (tsc → functions/lib/)
npm run deploy   # Deploy só das functions
```

---

## Pré-requisitos (1 vez só)

### 1. Instalar o Firebase CLI

Se ainda não estiver instalado na sua máquina:

```bash
npm install -g firebase-tools
```

Confirme que instalou:

```bash
firebase --version
```

### 2. Fazer login no Firebase

```bash
firebase login
```

Esse comando abre o navegador e pede autenticação na conta Google associada ao projeto `horamed-firebase`. É feito uma vez por máquina.

### 3. Confirmar que está apontando para o projeto certo

```bash
firebase projects:list
firebase use horamed-firebase
```

A última linha garante que os deploys vão para o projeto correto, mesmo que você tenha vários no mesmo Firebase.

### 4. Conferir as variáveis de ambiente

O projeto tem `.env`, `.env.firebase`, `.env.production` e `.env.example`. Para o deploy de produção, **o build precisa usar `.env.production`** (que o Vite carrega automaticamente em `vite build`).

Confira que `.env.production` tem as variáveis Firebase corretas (sem expor valores no terminal):

```bash
# Windows PowerShell
Select-String -Path .env.production -Pattern "VITE_FIREBASE" | Select-Object Line | Measure-Object

# Bash / WSL
grep -c "VITE_FIREBASE" .env.production
```

Se faltar alguma `VITE_FIREBASE_*`, copie do `.env.example` e preencha antes de continuar.

---

## Deploy completo (caminho recomendado)

Sequência segura, do mais barato para o mais arriscado:

### Passo 1 — Validar antes de buildar

```bash
npm run typecheck
npm run lint
npm test
```

Os três precisam passar. Se `lint` ou `typecheck` quebrarem, **pare aqui** — deploy com type errors quebra produção.

### Passo 2 — Build do front-end

```bash
npm run build
```

O resultado vai para `dist/`. Confira que `dist/index.html` foi atualizado:

```bash
# Windows
Get-Item dist\index.html | Select-Object LastWriteTime

# Bash
ls -la dist/index.html
```

### Passo 3 — Build das Cloud Functions

```bash
cd functions
npm run build
cd ..
```

Isso compila TypeScript para `functions/lib/`. Sem isso, o deploy de functions falha.

### Passo 4 — Preview local antes do deploy (opcional, recomendado)

```bash
firebase emulators:start
```

Os emulators sobem hosting, functions, firestore e storage localmente em `http://localhost:5000` (hosting). Teste o fluxo crítico — login, criar perfil, lembrete, exportar receita — antes de subir.

### Passo 5 — Deploy

Caminho 1: tudo de uma vez (mais simples, mais arriscado):

```bash
firebase deploy
```

Caminho 2: por etapa (mais seguro, recomendado em primeiro deploy do dia):

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
firebase deploy --only functions
firebase deploy --only hosting
```

Ordem importa: **rules e indexes antes** das functions e do hosting. Se você subir hosting com novo schema sem subir rules antes, usuários reais podem hit erros de permission denied.

---

## Deploy parcial (rotinas comuns)

### Só mudou o front-end

```bash
npm run build
firebase deploy --only hosting
```

### Só mudou uma rule

```bash
npm run firebase:deploy:rules
```

(Esse atalho já está em `package.json` — sobe `firestore:rules` + `storage:rules`.)

### Só mudou uma Cloud Function

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions:nomeDaFuncao
```

Subir só uma função é muito mais rápido que subir todas.

### Mudou só os índices do Firestore

```bash
firebase deploy --only firestore:indexes
```

---

## Verificação pós-deploy

Logo após o deploy, valide três coisas:

1. **Hosting está vivo:**
   ```
   https://horamed-firebase.web.app
   https://horamed-firebase.firebaseapp.com
   ```
   Se houver domínio customizado, valide ele também.

2. **Functions estão respondendo:**
   ```bash
   firebase functions:log --only nomeDaFuncao
   ```
   Acompanhe os logs por 1-2 minutos para ver se há crash/exception nova.

3. **Rules não quebraram nada:**
   - Abra o app no navegador anônimo
   - Faça login
   - Tente criar e ler um documento (medicamento, perfil)
   - Se aparecer "permission denied" para fluxo válido, foi rules

---

## Rollback (se algo der errado)

### Hosting — voltar para versão anterior

O Firebase Hosting mantém histórico. No console:

```
console.firebase.google.com → horamed-firebase → Hosting → Versões → "Reverter para esta versão"
```

Ou via CLI:

```bash
firebase hosting:clone horamed-firebase:live <CHANNEL_ID>:live
```

### Functions — voltar deploy

Functions **não têm rollback automático**. Se a versão nova quebrou, opções:

1. Reverter o commit no git e redeployar:
   ```bash
   git revert HEAD
   cd functions && npm run build && cd ..
   firebase deploy --only functions
   ```
2. Se for emergência: desabilitar a função no console (Cloud Functions → função → Disable) enquanto investiga.

### Rules — voltar versão antiga

Cada deploy de rules cria histórico no console:

```
console.firebase.google.com → horamed-firebase → Firestore → Rules → "Histórico" → "Reverter"
```

---

## Troubleshooting

### "Failed to authenticate" / "Token expired"

```bash
firebase login --reauth
```

### "Build failed" no Vite

Vite quebra quando `.env.production` tem variável faltando. Confira:

```bash
grep "VITE_" .env.production | grep -c "="
```

Compare com `.env.example`. Tem que ter o mesmo número (ou mais) de linhas com `=`.

### "Functions deploy failed: Source code size exceeds the maximum allowed size"

Você está mandando `node_modules` ou logs no deploy. Confira `firebase.json → functions.ignore`. Já tem `node_modules`, `.git`, `firebase-debug.*.log`. Adicione `build_log*.txt` se for o caso (a pasta `functions/` tem `build_log.txt`, `build_log_2.txt`, `build_log_3.txt` — esses NÃO precisam ir).

Edite `firebase.json`:

```json
"functions": [{
  "source": "functions",
  "ignore": [
    "node_modules", ".git",
    "firebase-debug.log", "firebase-debug.*.log",
    "build_log*.txt", "build_log.txt"
  ]
}]
```

### "Hosting deploy succeeded but app shows 'Welcome to Firebase Hosting'"

Significa que o deploy subiu, mas `dist/index.html` é o template padrão — você esqueceu de rodar `npm run build` antes do deploy. Solução:

```bash
npm run build && firebase deploy --only hosting
```

### "Emulator can't bind to port 5000"

Algum processo já está usando a porta. Mate ou troque a porta em `firebase.json → emulators.hosting.port`.

### Service worker antigo cacheando versão velha do app

Já está mitigado em `firebase.json` — `index.html`, `sw.js` e `workbox-*.js` têm `Cache-Control: no-cache, no-store, must-revalidate`. Se mesmo assim ficar cache antigo, peça ao usuário para forçar refresh (Ctrl+Shift+R) ou fechar/abrir o app PWA.

---

## Checklist pré-deploy (resumo executivo)

Imprima e marque:

- [ ] `firebase login` ativo (testou com `firebase projects:list`)
- [ ] `firebase use horamed-firebase` confirmado
- [ ] `.env.production` tem todas as `VITE_FIREBASE_*` necessárias
- [ ] `npm run typecheck` passou
- [ ] `npm run lint` passou
- [ ] `npm test` passou
- [ ] `npm run build` rodou com sucesso (dist/index.html atualizado)
- [ ] `cd functions && npm run build` rodou (functions/lib/ atualizado)
- [ ] Testou em `firebase emulators:start` o fluxo crítico (login + criar dose + lembrete)
- [ ] Tem 5 minutos livres para acompanhar logs após deploy

Só então:

```bash
firebase deploy
```

ou, ainda mais seguro:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
firebase deploy --only hosting
```

---

## Comandos rápidos (cola pronta)

```bash
# Deploy completo do zero
npm run typecheck && npm run lint && npm test \
  && npm run build \
  && cd functions && npm run build && cd .. \
  && firebase deploy

# Deploy só hosting (mudança de UI)
npm run build && firebase deploy --only hosting

# Deploy só functions (mudança de backend)
cd functions && npm run build && cd .. && firebase deploy --only functions

# Deploy só rules (mudança de permissão)
npm run firebase:deploy:rules

# Ver logs em tempo real
firebase functions:log

# Rodar emulator local
firebase emulators:start
```

---

## Notas finais

- **Build não deve ser rodado em sandbox/CI sem cuidado:** o build do Vite com Capacitor + React + dependências é pesado (>200s em ambientes com pouca RAM). Rode na sua máquina ou em runner dedicado.
- **`functions/build_log*.txt` não devem ir ao deploy:** considere movê-los ou adicioná-los ao `firebase.json → functions.ignore` (ver troubleshooting).
- **`migrate:full` não é um comando de deploy:** é o script de migração Supabase → Firebase, deve ser rodado uma única vez por ambiente, com cuidado, e fora do fluxo de deploy normal.
- **Versão atual do app (package.json):** `1.0.53`. Atualize antes do deploy se for release marcada.

---

Documento gerado em 27/04/2026 com base em: `firebase.json`, `.firebaserc`, `package.json`, `functions/package.json` do repositório.
