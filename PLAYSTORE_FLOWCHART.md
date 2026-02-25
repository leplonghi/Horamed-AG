# 🗺️ Fluxo de Publicação - Play Store

> **Diagrama visual do processo completo de publicação**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    FLUXO DE PUBLICAÇÃO - GOOGLE PLAY STORE                ║
║                              HoraMed v1.0.5                                ║
╚═══════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 0: PREPARAÇÃO (VOCÊ ESTÁ AQUI - 91% COMPLETO)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ├─→ ✅ Capacitor configurado
                                    ├─→ ✅ Build Gradle OK
                                    ├─→ ✅ Keystore criada
                                    ├─→ ✅ AAB gerado (12.18 MB)
                                    ├─→ ✅ Ícones Android OK
                                    └─→ ⚠️  google-services.json (opcional)
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Adicionar Firebase?         │
                    │   (google-services.json)      │
                    └───────────────────────────────┘
                              │           │
                        SIM   │           │   NÃO
                              │           │
                    ┌─────────▼───────┐   │
                    │ 1. Download do  │   │
                    │    Firebase     │   │
                    │ 2. Copiar para  │   │
                    │    android/app/ │   │
                    │ 3. Rebuild AAB  │   │
                    └─────────┬───────┘   │
                              │           │
                              └─────┬─────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 1: CONTA DE DESENVOLVEDOR (30 min)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 1. Acessar Play Console        │
                    │    play.google.com/console     │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 2. Pagar Taxa USD $25          │
                    │    (Pagamento único)           │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 3. Preencher Informações       │
                    │    - Nome/Empresa              │
                    │    - Endereço                  │
                    │    - Contato                   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 4. Aceitar Termos              │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 2: PREPARAÇÃO DE ASSETS (2-4 horas)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 1. Criar Ícone 512x512         │
                    │    Ferramenta: icon.kitchen    │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 2. Criar Feature Graphic       │
                    │    1024x500 PNG                │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 3. Capturar Screenshots        │
                    │    Mínimo: 2                   │
                    │    Recomendado: 4-8            │
                    │    Tamanho: 1080x1920          │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 4. Publicar Política           │
                    │    de Privacidade              │
                    │    horamed.app/privacy         │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 3: CONFIGURAÇÃO NA PLAY CONSOLE (1-2 horas)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 1. Criar App "HoraMed"         │
                    │    - Idioma: PT-BR             │
                    │    - Tipo: App                 │
                    │    - Gratuito                  │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 2. Preencher Descrições        │
                    │    Usar: PLAYSTORE_TEMPLATES   │
                    │    - Curta (80 chars)          │
                    │    - Completa (4000 chars)     │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 3. Upload de Assets            │
                    │    - Ícone 512x512             │
                    │    - Feature Graphic           │
                    │    - Screenshots               │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 4. Configurar Privacidade      │
                    │    - Política de Privacidade   │
                    │    - Segurança de Dados        │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 5. Classificação de Conteúdo   │
                    │    Categoria: Saúde/Medicina   │
                    │    Idade: L ou 10+             │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 6. Definir Público-alvo        │
                    │    Principal: 18-65+           │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 4: UPLOAD DO AAB (15 min)                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 1. Produção > Nova Versão      │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 2. Upload do AAB               │
                    │    android/app/build/outputs/  │
                    │    bundle/release/             │
                    │    app-release.aab             │
                    │    Tamanho: 12.18 MB ✅        │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 3. Preencher Notas da Versão   │
                    │    Usar: PLAYSTORE_TEMPLATES   │
                    │    - Português                 │
                    │    - English                   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 4. Revisar e Salvar            │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 5: TESTES (OPCIONAL - 1-3 dias)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │   Fazer Teste Interno?         │
                    └───────────────┬────────────────┘
                              │           │
                        SIM   │           │   NÃO
                              │           │
                    ┌─────────▼───────┐   │
                    │ 1. Criar Faixa  │   │
                    │    de Teste     │   │
                    │ 2. Adicionar    │   │
                    │    Testadores   │   │
                    │ 3. Distribuir   │   │
                    │ 4. Coletar      │   │
                    │    Feedback     │   │
                    └─────────┬───────┘   │
                              │           │
                              └─────┬─────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 6: PUBLICAÇÃO (1-7 dias)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 1. Revisar Checklist Final     │
                    │    Usar: PLAYSTORE_CHECKLIST   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 2. Enviar para Revisão         │
                    │    "Iniciar lançamento para    │
                    │     produção"                  │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 3. Análise Automática          │
                    │    Tempo: 1-2 horas            │
                    │    - Malware                   │
                    │    - Vulnerabilidades          │
                    │    - Permissões                │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 4. Revisão Manual Google       │
                    │    Tempo: 1-7 dias             │
                    │    Média: 2-3 dias             │
                    └───────────────┬────────────────┘
                                    │
                              ┌─────▼─────┐
                              │ Aprovado? │
                              └─────┬─────┘
                                    │
                        ┌───────────┼───────────┐
                        │                       │
                     APROVADO                REJEITADO
                        │                       │
            ┌───────────▼────────────┐  ┌───────▼────────┐
            │ 5. Publicação          │  │ 1. Ler motivos │
            │    Tempo: até 2 horas  │  │ 2. Corrigir    │
            │    App disponível na   │  │ 3. Reenviar    │
            │    Play Store! 🎉      │  └───────┬────────┘
            └───────────┬────────────┘          │
                        │                       │
                        └───────────┬───────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FASE 7: PÓS-PUBLICAÇÃO (Contínuo)                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 1. Monitorar Métricas          │
                    │    - Instalações               │
                    │    - Avaliações                │
                    │    - Crashes                   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 2. Responder Avaliações        │
                    │    Tempo: até 24h              │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 3. Corrigir Bugs Críticos      │
                    │    Se necessário               │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ 4. Planejar Próxima Atualização│
                    │    - Novos recursos            │
                    │    - Melhorias                 │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                        ┌───────────────────┐
                        │  CICLO CONTÍNUO   │
                        │  DE ATUALIZAÇÕES  │
                        └───────────────────┘


╔═══════════════════════════════════════════════════════════════════════════╗
║                            TIMELINE ESTIMADO                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Fase 0: Preparação          │ ✅ COMPLETO (91%)                          ║
║  Fase 1: Conta Desenvolvedor │ 30 minutos                                 ║
║  Fase 2: Assets              │ 2-4 horas                                  ║
║  Fase 3: Configuração        │ 1-2 horas                                  ║
║  Fase 4: Upload AAB          │ 15 minutos                                 ║
║  Fase 5: Testes (opcional)   │ 1-3 dias                                   ║
║  Fase 6: Revisão Google      │ 1-7 dias (média: 2-3 dias)                 ║
║  Fase 7: Pós-publicação      │ Contínuo                                   ║
║─────────────────────────────────────────────────────────────────────────║
║  TOTAL (sem testes)          │ 4-6 horas + 1-7 dias revisão               ║
║  TOTAL (com testes)          │ 4-6 horas + 2-10 dias                      ║
╚═══════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════╗
║                         RECURSOS DISPONÍVEIS                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  📖 Guia Completo           │ PLAYSTORE_DEPLOYMENT_GUIDE.md               ║
║  ✅ Checklist Visual        │ PLAYSTORE_CHECKLIST.md                      ║
║  ⚡ Guia Rápido             │ PLAYSTORE_QUICKSTART.md                     ║
║  📝 Templates               │ PLAYSTORE_TEMPLATES.md                      ║
║  📊 Status Atual            │ PLAYSTORE_STATUS.md                         ║
║  📚 Índice Mestre           │ PLAYSTORE_INDEX.md                          ║
║  🔍 Script Verificação      │ .agent/scripts/check_playstore_ready.py     ║
╚═══════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════╗
║                         COMANDOS ÚTEIS                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Verificar status           │ python .agent\scripts\check_playstore_ready.py ║
║  Build web                  │ npm run build                               ║
║  Sync Capacitor             │ npx cap sync android                        ║
║  Build AAB                  │ cd android && ./gradlew bundleRelease       ║
║  Abrir Android Studio       │ npx cap open android                        ║
╚═══════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════╗
║                         PRÓXIMO PASSO                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  🎯 Você está na FASE 0 (91% completo)                                    ║
║                                                                            ║
║  Opção A: Publicar SEM Firebase                                           ║
║  → Ir direto para FASE 1 (Criar Conta de Desenvolvedor)                  ║
║                                                                            ║
║  Opção B: Adicionar Firebase ANTES                                        ║
║  → Baixar google-services.json → Rebuild → FASE 1                        ║
║                                                                            ║
║  📖 Consulte: PLAYSTORE_STATUS.md para decisão                            ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

**Legenda**:
- ✅ = Completo
- ⚠️ = Opcional/Pendente
- 🎉 = Sucesso
- ▼ = Próximo passo
- ┌─┐ = Decisão
- │ = Fluxo linear

**Última atualização**: 02/02/2026
