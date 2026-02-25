# 📋 Checklist de Publicação - Play Store

> **Status**: 🟡 Em Preparação  
> **Última atualização**: 02/02/2026

---

## 🎯 Progresso Geral

```
[░░░░░░░░░░] 0% - Não iniciado
```

**Etapas concluídas:** 0/10

---

## 📝 Etapas de Publicação

### 1️⃣ Pré-requisitos (0/6)

- [ ] Node.js v18+ instalado
- [ ] Java JDK 17+ instalado
- [ ] Android Studio instalado
- [ ] Android SDK configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências do projeto instaladas (`npm install`)

**📖 Guia:** Seção 1 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

---

### 2️⃣ Keystore de Produção (0/5)

- [ ] Pasta `android/keystore/` criada
- [ ] Keystore gerada (`horamed-release.keystore`)
- [ ] Variável de ambiente `HORAMED_KEYSTORE_PASSWORD` configurada
- [ ] Backup da keystore feito (3 locais)
- [ ] Senha anotada em local seguro

**📖 Guia:** Seção 3 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

**⚠️ CRÍTICO:** Sem backup da keystore, você não poderá atualizar o app no futuro!

---

### 3️⃣ Build de Produção (0/6)

- [ ] Build web executado (`npm run build`)
- [ ] Pasta `dist/` gerada com sucesso
- [ ] Capacitor sincronizado (`npx cap sync android`)
- [ ] Projeto aberto no Android Studio
- [ ] Build variant "release" selecionado
- [ ] AAB gerado (`./gradlew bundleRelease`)

**📖 Guia:** Seção 4 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

**📍 Localização do AAB:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

### 4️⃣ Conta de Desenvolvedor (0/4)

- [ ] Conta Google criada/selecionada
- [ ] Taxa de registro paga (USD $25)
- [ ] Informações da conta preenchidas
- [ ] Termos e políticas aceitos

**📖 Guia:** Seção 5 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

**🔗 Link:** [Google Play Console](https://play.google.com/console)

---

### 5️⃣ Assets Gráficos (0/4)

- [ ] Ícone 512x512 criado
- [ ] Feature Graphic 1024x500 criado
- [ ] Screenshots capturados (mínimo 2, recomendado 4-8)
- [ ] Vídeo promocional criado (opcional)

**📖 Guia:** Seção 6 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

**🎨 Ferramentas:**
- Ícones: [icon.kitchen](https://icon.kitchen/)
- Screenshots: Android Studio Device Manager

---

### 6️⃣ Configuração na Play Console (0/9)

- [ ] App criado na Play Console
- [ ] Descrição curta escrita (PT e EN)
- [ ] Descrição completa escrita (PT e EN)
- [ ] Categoria selecionada (Saúde e fitness)
- [ ] Informações de contato preenchidas
- [ ] Política de Privacidade configurada
- [ ] Classificação de conteúdo completa
- [ ] Público-alvo definido
- [ ] Segurança de dados declarada

**📖 Guia:** Seção 7 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

---

### 7️⃣ Upload do AAB (0/3)

- [ ] AAB enviado para Play Console
- [ ] Notas da versão escritas (PT e EN)
- [ ] Versão revisada e salva

**📖 Guia:** Seção 8 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

---

### 8️⃣ Testes (0/3)

- [ ] Teste interno configurado (opcional, mas recomendado)
- [ ] Testadores adicionados e app testado
- [ ] Validações automáticas da Google passaram

**📖 Guia:** Seção 9 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

**⏱️ Tempo de validação:** 1-7 dias (média: 2-3 dias)

---

### 9️⃣ Publicação (0/3)

- [ ] Checklist final revisado
- [ ] App enviado para revisão
- [ ] App aprovado pela Google

**📖 Guia:** Seção 10 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

**📧 Notificações:** Você receberá emails sobre o status da revisão

---

### 🔟 Pós-Publicação (0/4)

- [ ] Métricas monitoradas (instalações, crashes)
- [ ] Avaliações respondidas
- [ ] Feedback coletado
- [ ] Primeira atualização planejada

**📖 Guia:** Seção 11 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`

---

## 🚨 Verificações Críticas Antes de Enviar

### Configuração de Produção

- [ ] `capacitor.config.ts` - `server.url` está **COMENTADO**
- [ ] `capacitor.config.ts` - `webContentsDebuggingEnabled: false`
- [ ] `android/app/build.gradle` - `versionCode` e `versionName` corretos
- [ ] Firebase configurado para produção (não dev)
- [ ] Stripe configurado para produção (se aplicável)

### Testes Finais

- [ ] App testado em dispositivo físico Android
- [ ] App testado em emulador Android
- [ ] Login/Registro funcionando
- [ ] Notificações funcionando
- [ ] Todas as telas navegáveis
- [ ] Sem crashes ou erros críticos
- [ ] Performance aceitável (sem lentidão)

### Legal

- [ ] Política de Privacidade publicada e acessível
- [ ] Termos de Uso publicados (se aplicável)
- [ ] Conformidade com LGPD verificada
- [ ] Direitos autorais de imagens verificados

---

## 📞 Suporte e Recursos

### Documentação
- **Guia Completo**: `PLAYSTORE_DEPLOYMENT_GUIDE.md`
- **Play Console Help**: [support.google.com/googleplay](https://support.google.com/googleplay/android-developer)
- **Capacitor Docs**: [capacitorjs.com/docs/android](https://capacitorjs.com/docs/android)

### Troubleshooting
- **Problemas comuns**: Seção 12 do `PLAYSTORE_DEPLOYMENT_GUIDE.md`
- **Stack Overflow**: [stackoverflow.com/questions/tagged/android](https://stackoverflow.com/questions/tagged/android)

### Contatos
- **Email de suporte**: suporte@horamed.app
- **Desenvolvedor**: Leonardo Plonghi

---

## 📊 Timeline Estimado

| Etapa | Tempo Estimado |
|-------|----------------|
| 1. Pré-requisitos | 1-2 horas |
| 2. Keystore | 15 minutos |
| 3. Build | 30 minutos |
| 4. Conta Desenvolvedor | 30 minutos |
| 5. Assets | 2-4 horas |
| 6. Configuração Console | 1-2 horas |
| 7. Upload AAB | 15 minutos |
| 8. Testes | 1-3 dias |
| 9. Revisão Google | 1-7 dias |
| **TOTAL** | **5-10 dias** |

---

## 🎯 Próximos Passos

1. **Agora**: Começar pela Etapa 1 (Pré-requisitos)
2. **Seguir**: Ordem sequencial das etapas
3. **Marcar**: Cada item concluído com `[x]`
4. **Consultar**: Guia detalhado quando tiver dúvidas

---

**Boa sorte com a publicação! 🚀**

*Última atualização: 02/02/2026*
