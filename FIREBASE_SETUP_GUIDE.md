# 🔥 Guia: Criar Projeto Firebase

## Passo 1: Criar Projeto no Console

1. **Abra o Firebase Console**:  
   https://console.firebase.google.com/

2. **Clique em "Add project" (Adicionar projeto)**

3. **Configure o projeto**:
   - **Nome do projeto**: `HoraMed`
   - **Project ID**: `horamed-firebase`
   - **Google Analytics**: ✅ Ativar (recomendado)
   - **Analytics Location**: Brazil
   - **Aceite os termos** e clique em "Create project"

4. **Aguarde a criação** (~30 segundos)

---

## Passo 2: Ativar Serviços

### 2.1 Authentication
1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Get started"**
3. Ative os seguintes métodos:
   - ✅ **Email/Password** (Sign-in method)
   - ✅ **Google** (Sign-in method)

### 2.2 Firestore Database
1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Create database"**
3. Escolha:
   - **Location**: `southamerica-east1` (São Paulo)
   - **Security rules**: Start in **production mode** (vamos sobrescrever com nossas rules)
4. Clique em **"Enable"**

### 2.3 Storage
1. No menu lateral, clique em **"Storage"**
2. Clique em **"Get started"**
3. Escolha:
   - **Security rules**: Start in **production mode**
   - **Location**: `southamerica-east1` (São Paulo)
4. Clique em **"Done"**

### 2.4 Functions (Cloud Functions)
1. No menu lateral, clique em **"Functions"**
2. Clique em **"Get started"**
3. **Upgrade to Blaze Plan** (pay-as-you-go)
   - ⚠️ Não se preocupe: Firebase tem free tier generoso
   - Você só paga se ultrapassar os limites gratuitos

---

## Passo 3: Obter Credenciais do Web App

1. No menu lateral, clique no **ícone de engrenagem** ⚙️ > **"Project settings"**
2. Role até **"Your apps"**
3. Clique no ícone **</> (Web)**
4. Configure:
   - **App nickname**: `HoraMed Web`
   - ✅ **Also set up Firebase Hosting** (marcar)
5. Clique em **"Register app"**
6. **Copie as credenciais** que aparecem:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "horamed-prod.firebaseapp.com",
  projectId: "horamed-prod",
  storageBucket: "horamed-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

7. **Cole essas credenciais no arquivo `.env.firebase`**

---

## Passo 4: Configurar Firebase CLI

Após criar o projeto e obter as credenciais, volte aqui e me avise.

Vou executar:
```bash
firebase use horamed-prod
firebase deploy --only firestore:rules,storage:rules
```

---

## ✅ Checklist

- [ ] Projeto criado no Firebase Console
- [ ] Authentication ativado (Email + Google)
- [ ] Firestore Database criado (São Paulo)
- [ ] Storage ativado (São Paulo)
- [ ] Blaze Plan ativado (para Functions)
- [ ] Web App registrado
- [ ] Credenciais copiadas para `.env.firebase`

**Quando terminar, me avise para continuar com a migração!** 🚀
