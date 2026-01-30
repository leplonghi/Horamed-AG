# 🔍 Guia de Verificação da Conexão Supabase

## ✅ Checklist de Conexão

### 1. Verificar Credenciais Frontend (Já Configurado)
- [x] `VITE_SUPABASE_URL` definido
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` definido
- [x] `VITE_SUPABASE_PROJECT_ID` definido

### 2. Obter Credenciais Adicionais (Necessário)

#### 🔐 Service Role Key
**Onde obter:** https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/settings/api

1. Acesse o link acima
2. Procure por "service_role" (secret)
3. Clique em "Reveal" ou "Copy"
4. Adicione ao `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

#### 🗄️ Database Password
**Onde obter:** https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/settings/database

1. Acesse o link acima
2. Procure por "Database Password" ou "Connection String"
3. Se não souber a senha, clique em "Reset Database Password"
4. Adicione ao `.env`:
   ```
   SUPABASE_DB_PASSWORD="sua-senha-aqui"
   DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.zmsuqdwleyqpdthaqvbi.supabase.co:5432/postgres"
   ```

#### 🔑 JWT Secret
**Onde obter:** https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/settings/api

1. Acesse o link acima
2. Procure por "JWT Secret"
3. Copie o valor
4. Adicione ao `.env`:
   ```
   SUPABASE_JWT_SECRET="seu-jwt-secret"
   ```

#### 🛠️ Access Token (Para CLI)
**Onde obter:** https://supabase.com/dashboard/account/tokens

1. Acesse o link acima
2. Clique em "Generate new token"
3. Dê um nome (ex: "HoraMed Local Dev")
4. Copie o token
5. Adicione ao `.env`:
   ```
   SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxx"
   ```

---

## 🧪 Testes de Conexão

### Teste 1: Verificar se o App Está Conectado
```bash
# O app já deve estar rodando em http://localhost:8080
# Abra o console do navegador (F12) e execute:
```
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Project ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
```

### Teste 2: Verificar Autenticação
```bash
# No console do navegador:
```
```javascript
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data);
console.log('Error:', error);
```

### Teste 3: Verificar Conexão com Banco
```bash
# No console do navegador:
```
```javascript
const { data, error } = await supabase.from('profiles').select('count');
console.log('Profiles count:', data);
console.log('Error:', error);
```

### Teste 4: Verificar Edge Functions
```bash
# No terminal:
npx supabase functions list --project-ref zmsuqdwleyqpdthaqvbi
```

### Teste 5: Verificar Storage
```bash
# No console do navegador:
```
```javascript
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets:', data);
console.log('Error:', error);
```

---

## 🚀 Próximos Passos

### 1. Configurar Supabase CLI (Opcional, mas recomendado)
```bash
# Instalar globalmente
npm install -g supabase

# Login
npx supabase login

# Link ao projeto
npx supabase link --project-ref zmsuqdwleyqpdthaqvbi
```

### 2. Sincronizar Edge Functions
```bash
# Listar functions remotas
npx supabase functions list --project-ref zmsuqdwleyqpdthaqvbi

# Deploy de uma function específica
npx supabase functions deploy health-assistant --project-ref zmsuqdwleyqpdthaqvbi
```

### 3. Verificar Migrações
```bash
# Ver status das migrações
npx supabase db diff --linked

# Aplicar migrações pendentes (se houver)
npx supabase db push
```

---

## 📋 Resumo de URLs Importantes

| Recurso | URL |
|---------|-----|
| **Dashboard Principal** | https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi |
| **API Settings** | https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/settings/api |
| **Database Settings** | https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/settings/database |
| **Storage** | https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/storage/buckets |
| **Edge Functions** | https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/functions |
| **Auth Settings** | https://supabase.com/dashboard/project/zmsuqdwleyqpdthaqvbi/auth/users |
| **Access Tokens** | https://supabase.com/dashboard/account/tokens |

---

## ⚠️ Segurança

### Nunca commite o arquivo `.env`!
O `.gitignore` já está configurado para ignorar `.env`, mas sempre verifique:

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep .env
```

### Variáveis Públicas vs Secretas

**✅ Podem ser públicas (VITE_*):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

**🔐 DEVEM ser secretas (NUNCA commitar):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_ACCESS_TOKEN`

---

## 🆘 Troubleshooting

### Erro: "Invalid API key"
- Verifique se a `VITE_SUPABASE_PUBLISHABLE_KEY` está correta
- Confirme que não há espaços extras no `.env`

### Erro: "Failed to fetch"
- Verifique se a `VITE_SUPABASE_URL` está correta
- Confirme que o projeto está ativo no Supabase Dashboard

### Erro: "Row Level Security policy violation"
- Verifique as políticas RLS no dashboard
- Para operações admin, use a `SUPABASE_SERVICE_ROLE_KEY`

### Erro: "JWT expired"
- Faça logout e login novamente
- Verifique se o `SUPABASE_JWT_SECRET` está correto
