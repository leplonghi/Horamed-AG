# 🔐 Como se Tornar Super Admin

## Método 1: Via Console do Navegador (Mais Rápido)

### Passo a Passo:

1. **Acesse o app online** (ex: `https://app.horamed.net`)

2. **Faça login** com `leplonghi@gmail.com`

3. **Abra o Console do Navegador:**
   - Windows/Linux: `F12` ou `Ctrl + Shift + J`
   - Mac: `Cmd + Option + J`

4. **Cole este código** e pressione Enter:

```javascript
// Importar Firebase
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

// Configuração do Firebase (use suas credenciais)
const firebaseConfig = {
  // Suas credenciais aqui
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Promover para Super Admin
const user = auth.currentUser;

if (!user) {
  console.error('❌ Você precisa estar logado!');
} else if (user.email !== 'leplonghi@gmail.com') {
  console.error('❌ Este script só funciona para leplonghi@gmail.com');
} else {
  const adminData = {
    email: user.email,
    role: 'super_admin',
    permissions: {
      campaignGenerator: true,
      userManagement: true,
      analytics: true,
      contentModeration: true
    },
    createdAt: new Date().toISOString()
  };

  const adminRef = doc(db, "admins", user.uid);
  
  setDoc(adminRef, adminData).then(() => {
    console.log('✅ Super Admin criado com sucesso!');
    console.log('🔄 Recarregue a página para ver as mudanças.');
  }).catch((error) => {
    console.error('❌ Erro:', error);
  });
}
```

5. **Recarregue a página** (`F5`)

6. **Pronto!** Você verá um botão flutuante roxo 🚀 no canto inferior direito

---

## Método 2: Via Firestore Console (Manual)

### Passo a Passo:

1. **Acesse o Firebase Console:**
   - Vá para: https://console.firebase.google.com
   - Selecione seu projeto HoraMed

2. **Abra o Firestore Database:**
   - No menu lateral, clique em "Firestore Database"

3. **Crie a coleção `admins`** (se não existir):
   - Clique em "Start collection"
   - Nome da coleção: `admins`

4. **Adicione um documento:**
   - Document ID: `[SEU_USER_ID]` (você encontra isso no Authentication)
   - Campos:

```json
{
  "email": "leplonghi@gmail.com",
  "role": "super_admin",
  "permissions": {
    "campaignGenerator": true,
    "userManagement": true,
    "analytics": true,
    "contentModeration": true
  },
  "createdAt": "2026-01-31T18:00:00.000Z"
}
```

5. **Salve** e recarregue o app

---

## Método 3: Via Backend (Permanente)

Se você quiser que `leplonghi@gmail.com` seja **sempre** admin automaticamente:

### Edite `Auth.tsx`:

Adicione após o cadastro/login:

```typescript
// Após criar/logar usuário
if (firebaseUser.email === 'leplonghi@gmail.com') {
  await AdminService.createSuperAdmin(firebaseUser.uid, firebaseUser.email);
}
```

---

## Como Verificar se Funcionou:

### ✅ Sinais de Sucesso:

1. **Botão Flutuante Roxo** 🚀 aparece no canto inferior direito da página "Hoje"
2. **Ao clicar no botão**, você é redirecionado para `/internal/campaign-generator`
3. **No Firestore**, existe um documento em `admins/[SEU_USER_ID]`

### ❌ Se Não Funcionar:

1. **Verifique o Console do Navegador** (F12) por erros
2. **Confirme que está logado** com `leplonghi@gmail.com`
3. **Verifique o Firestore** se o documento foi criado
4. **Limpe o cache** do navegador (`Ctrl + Shift + Delete`)
5. **Tente em aba anônima** (`Ctrl + Shift + N`)

---

## Acessando o Campaign Generator:

### Opção 1: Via Botão Flutuante
- Vá para a página "Hoje" (`/hoje`)
- Clique no botão roxo 🚀 no canto inferior direito

### Opção 2: Via URL Direta
- Digite manualmente: `https://app.horamed.net/internal/campaign-generator`

### Opção 3: Via Menu (Futuro)
- Adicione um item no menu lateral para admins

---

## Permissões de Admin:

### Super Admin (você):
- ✅ Acesso total ao Campaign Generator
- ✅ Gerenciamento de usuários
- ✅ Analytics e métricas
- ✅ Moderação de conteúdo

### Admin (outros):
- ✅ Acesso ao Campaign Generator
- ❌ Sem gerenciamento de usuários
- ✅ Analytics (somente leitura)

### Moderator:
- ❌ Sem acesso ao Campaign Generator
- ❌ Sem gerenciamento de usuários
- ✅ Moderação de conteúdo

---

## Segurança:

### ⚠️ IMPORTANTE:

1. **Nunca compartilhe** seu User ID ou credenciais
2. **Use HTTPS** sempre (nunca HTTP)
3. **Firestore Rules** devem proteger a coleção `admins`:

```javascript
match /admins/{adminId} {
  allow read: if request.auth != null && request.auth.uid == adminId;
  allow write: if false; // Apenas via backend
}
```

4. **Revogue acessos** de ex-colaboradores imediatamente

---

## Troubleshooting:

### "Botão não aparece"
- Verifique se o documento existe em `admins/[SEU_USER_ID]`
- Recarregue a página (`F5`)
- Limpe o cache

### "Erro ao acessar /internal/campaign-generator"
- Verifique se a rota existe em `App.tsx`
- Confirme que `ProtectedRoute` está configurado

### "Permissão negada no Firestore"
- Ajuste as Firestore Rules
- Verifique se o User ID está correto

---

**Pronto! Agora você tem acesso total ao Marketing Brain. 🚀**

Qualquer dúvida, consulte este guia ou entre em contato.
