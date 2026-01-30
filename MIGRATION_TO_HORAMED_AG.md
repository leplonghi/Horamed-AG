# 🚀 Script para Migrar para horamed-AG

## ⚠️ EXECUTE ESTE SCRIPT SOMENTE APÓS CRIAR O REPOSITÓRIO NO GITHUB

### Pré-requisitos:
1. Você já criou o repositório `horamed-AG` no GitHub
2. O repositório está vazio (sem README, .gitignore, etc)
3. Você tem as credenciais configuradas no Git

---

## 📝 Comandos para Executar (em ordem)

### 1. Renomear o remote atual (backup)
```powershell
git remote rename origin lovable-backup
```

### 2. Adicionar o novo remote (horamed-AG)
```powershell
# Substitua 'leplonghi' pelo seu username do GitHub se for diferente
git remote add origin https://github.com/leplonghi/horamed-AG.git
```

### 3. Verificar os remotes
```powershell
git remote -v
```

**Você deve ver algo como:**
```
lovable-backup  https://github.com/leplonghi/horamed.git (fetch)
lovable-backup  https://github.com/leplonghi/horamed.git (push)
origin          https://github.com/leplonghi/horamed-AG.git (fetch)
origin          https://github.com/leplonghi/horamed-AG.git (push)
```

### 4. Fazer push para o novo repositório
```powershell
git push -u origin main
```

### 5. (Opcional) Remover o remote do Lovable
```powershell
# Execute isso somente se tiver certeza que não precisa mais do Lovable
git remote remove lovable-backup
```

---

## ✅ Verificação Final

Após executar os comandos acima:

1. **Acesse**: https://github.com/leplonghi/horamed-AG
2. **Verifique**: Se todos os arquivos foram enviados
3. **Confirme**: Se o README.md está atualizado (sem referências ao Lovable)

---

## 🔄 Workflow Futuro

De agora em diante, seus comandos Git serão:

```powershell
# Fazer mudanças
git add .
git commit -m "sua mensagem"

# Enviar para horamed-AG
git push origin main

# Puxar atualizações
git pull origin main
```

---

## 🆘 Solução de Problemas

### Erro: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/leplonghi/horamed-AG.git
```

### Erro: "Authentication failed"
```powershell
# Configure suas credenciais
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Use GitHub CLI ou Personal Access Token
# https://github.com/settings/tokens
```

### Erro: "Updates were rejected"
```powershell
# Force push (use com cuidado!)
git push -u origin main --force
```

---

## 📊 Status Atual

- ✅ README.md atualizado (sem Lovable)
- ✅ package.json atualizado (nome: horamed)
- ✅ Commit criado com as mudanças
- ⏳ Aguardando criação do repositório horamed-AG
- ⏳ Aguardando configuração do remote
- ⏳ Aguardando push inicial

---

## 📞 Próximos Passos

1. **Criar repositório** no GitHub: https://github.com/new
2. **Executar comandos** acima (seções 1-4)
3. **Verificar** se tudo funcionou
4. **Continuar desenvolvimento** normalmente!

---

**Data de criação**: 2026-01-30
**Versão**: 1.0
