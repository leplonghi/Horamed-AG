# 🔑 Configurar Service Account do Firebase

Para importar dados para o Firestore, precisamos de uma Service Account Key.

## Passo 1: Criar Service Account Key

1. **Acesse o Firebase Console**:  
   https://console.firebase.google.com/project/horamed-firebase/settings/serviceaccounts/adminsdk

2. **Clique em "Generate new private key"**

3. **Confirme** clicando em "Generate key"

4. **Baixe o arquivo JSON** (será algo como `horamed-firebase-firebase-adminsdk-xxxxx.json`)

5. **Salve o arquivo** como:  
   `c:\Antigravity\horamed\horamed\firebase-service-account.json`

---

## Passo 2: Adicionar ao .gitignore

O arquivo já está no `.gitignore`, mas vamos garantir:

```
firebase-service-account.json
```

---

## Passo 3: Executar Importação

Após salvar o arquivo, execute:

```bash
npm run migrate:import
```

---

## ⚠️ IMPORTANTE

**NUNCA compartilhe ou commite este arquivo!**  
Ele contém credenciais privadas do seu projeto Firebase.

---

**Quando terminar, me avise dizendo:**

> "Service account criada e salva"

Aí eu continuo automaticamente com a importação!
