# ⚡ Guia Rápido - Publicação Play Store

> **Referência rápida de 1 página** - Para guia completo, veja `PLAYSTORE_DEPLOYMENT_GUIDE.md`

---

## 🎯 STATUS ATUAL

✅ **91% PRONTO** (21/23 verificações OK)  
⚠️ Falta apenas: `google-services.json` (opcional)

```bash
# Verificar status
python .agent\scripts\check_playstore_ready.py
```

---

## 🚀 PUBLICAÇÃO EM 5 PASSOS

### 1️⃣ Criar Conta Desenvolvedor (30 min)
- Acesse: https://play.google.com/console
- Pague USD $25 (vitalício)
- Preencha informações

### 2️⃣ Preparar Assets (2-4 horas)
- [ ] Ícone 512x512 PNG
- [ ] Feature Graphic 1024x500 PNG
- [ ] 4-8 Screenshots (1080x1920)
- [ ] Política de Privacidade publicada

**Ferramentas**: [icon.kitchen](https://icon.kitchen/) | Android Studio Device Manager

### 3️⃣ Configurar App na Console (1-2 horas)
- [ ] Criar app "HoraMed"
- [ ] Descrição curta (80 chars)
- [ ] Descrição completa (4000 chars)
- [ ] Categoria: Saúde e fitness
- [ ] Classificação de conteúdo
- [ ] Público-alvo: 18-65+
- [ ] Segurança de dados

### 4️⃣ Upload AAB (15 min)
```
Arquivo: android/app/build/outputs/bundle/release/app-release.aab
Tamanho: 12.18 MB ✅
```

- Play Console > Produção > Criar nova versão
- Upload do AAB
- Notas da versão (PT e EN)
- Revisar e salvar

### 5️⃣ Enviar para Revisão
- Revisar checklist final
- Clicar "Iniciar lançamento para produção"
- Aguardar 1-7 dias (média: 2-3 dias)

---

## 📦 REBUILD (se necessário)

```bash
# 1. Build web
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build AAB
cd android
./gradlew bundleRelease

# 4. Localização do AAB
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🔥 Firebase (Opcional)

**Se usar Push Notifications:**

1. Firebase Console > Project Settings > Your apps
2. Download `google-services.json`
3. Copiar para `android/app/`
4. Rebuild AAB

**Se NÃO usar**: Pode publicar sem este arquivo

---

## ✅ CHECKLIST PRÉ-PUBLICAÇÃO

### Técnico
- [x] AAB gerado e assinado
- [x] Keystore com backup (3 locais)
- [x] `webContentsDebuggingEnabled: false`
- [x] `server.url` comentado
- [ ] Testado em dispositivo real
- [ ] Todas funcionalidades OK

### Play Console
- [ ] Conta criada e paga
- [ ] Descrições (PT e EN)
- [ ] Ícone + Feature Graphic
- [ ] Screenshots (mínimo 2)
- [ ] Política de Privacidade
- [ ] Classificação de conteúdo
- [ ] Segurança de dados

### Legal
- [ ] Política de Privacidade publicada
- [ ] Conformidade LGPD

---

## 🆘 TROUBLESHOOTING

| Erro | Solução |
|------|---------|
| Keystore not found | Verificar `android/keystore/horamed-release.keystore` existe |
| Incorrect password | Verificar `$env:HORAMED_KEYSTORE_PASSWORD` |
| App not signed | Build variant = "release" no Android Studio |
| AAB muito grande | Já está OK (12.18 MB) |
| Firebase não funciona | Adicionar `google-services.json` |

---

## 📚 DOCUMENTAÇÃO

- **Guia Completo**: `PLAYSTORE_DEPLOYMENT_GUIDE.md` (500+ linhas)
- **Checklist Visual**: `PLAYSTORE_CHECKLIST.md` (10 etapas)
- **Status Atual**: `PLAYSTORE_STATUS.md` (resumo executivo)
- **Verificação**: `.agent/scripts/check_playstore_ready.py`

---

## 🎯 PRÓXIMO PASSO

**Opção A** (Sem Firebase): Ir para Passo 1 (Criar Conta)  
**Opção B** (Com Firebase): Adicionar `google-services.json` → Rebuild → Passo 1

---

## 📞 SUPORTE

**Email**: suporte@horamed.app  
**Desenvolvedor**: Leonardo Plonghi  
**Documentação Google**: https://support.google.com/googleplay/android-developer

---

**Boa sorte! 🚀**
