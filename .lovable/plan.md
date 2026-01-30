

# Plano de Migração HoraMed: Lovable Cloud → Antigravity

## Visão Geral do Projeto

O HoraMed é um aplicativo de gestão de medicamentos com:
- **36 usuários** cadastrados
- **13 medicamentos** ativos
- **431 doses** registradas
- **36 assinaturas** (Stripe integrado)
- **48 Edge Functions** serverless
- **49 tabelas** no banco de dados (47 BASE TABLE + 2 VIEW)
- **3 buckets** de storage privados

---

## Parte 1: Informações Disponíveis para Exportar

### Credenciais Públicas (você já tem acesso)
| Recurso | Valor |
|---------|-------|
| Project ID | `zmsuqdwleyqpdthaqvbi` |
| Supabase URL | `https://zmsuqdwleyqpdthaqvbi.supabase.co` |
| Anon Key | `eyJhbGci...0kWQr8` (completa no .env) |

### Domínios Configurados
| Tipo | URL |
|------|-----|
| App Principal | `https://app.horamed.net` |
| Landing Page | `https://horamed.net` |
| Preview | `https://id-preview--281a4314-4cea-4c93-9b25-b97f8d39e706.lovable.app` |

---

## Parte 2: Lista Completa de Tabelas (49 total)

### Tabelas Core do Negócio
```text
items                    → Medicamentos cadastrados (13 registros)
schedules                → Horários programados
dose_instances           → Histórico de doses (431 registros)
stock                    → Controle de estoque
alarms                   → Alarmes/lembretes
```

### Tabelas de Usuários
```text
user_profiles            → Perfis de usuários
profiles                 → Dados de perfil
subscriptions            → Assinaturas Stripe (36 registros)
consents                 → Consentimentos LGPD
health_history           → Histórico de saúde
weight_logs              → Registro de peso
sinais_vitais            → Sinais vitais
```

### Tabelas de Documentos Médicos
```text
documentos_saude         → Documentos de saúde
exames_laboratoriais     → Exames de laboratório
valores_exames           → Resultados de exames
medical_exams            → Exames médicos
consultas_medicas        → Consultas agendadas
vaccination_records      → Carteira de vacinação
document_extraction_logs → Logs de extração IA
extraction_cache         → Cache de extrações
categorias_saude         → Categorias de documentos
```

### Tabelas de Compartilhamento
```text
medical_shares           → Compartilhamentos médicos
document_shares          → Compartilhamento de docs
compartilhamentos_doc    → Links de compartilhamento
consultation_cards       → Cartões de consulta (QR)
caregiver_links          → Vínculos de cuidadores
caregivers               → Cuidadores
```

### Tabelas de Referral/Afiliados
```text
referrals                → Indicações
referral_goals           → Metas de indicações
referral_discounts       → Descontos
referral_rewards         → Recompensas
referral_fraud_logs      → Anti-fraude
affiliates               → Afiliados
affiliate_events         → Eventos de afiliados
```

### Tabelas de Notificações
```text
notification_preferences → Preferências
notification_logs        → Logs de envio
notification_metrics     → Métricas
push_subscriptions       → Web Push tokens
local_reminders          → Lembretes locais
```

### Tabelas de Interações/Medicamentos
```text
drug_interactions        → Interações básicas
medication_interactions  → Interações detalhadas
user_interaction_alerts  → Alertas do usuário
```

### Tabelas de Sistema
```text
feature_flags            → Feature toggles
audit_logs               → Logs de auditoria
app_metrics              → Métricas do app
premium_emails           → E-mails VIP
eventos_saude            → Eventos de saúde
health_insights          → Insights IA
side_effects_log         → Efeitos colaterais
```

### Views
```text
medical_exams_v          → View de exames
user_adherence_streaks   → View de aderência
```

---

## Parte 3: Secrets que Precisam ser Reconfigurados

Você precisará recuperar os valores originais destes secrets:

| Secret | Onde Obter |
|--------|------------|
| `STRIPE_SECRET_KEY` | Dashboard Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe → Webhooks |
| `GOOGLE_AI_API_KEY` | Google Cloud Console → Credentials |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google Cloud Console → OAuth |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google Cloud Console → OAuth |
| `VAPID_PUBLIC_KEY` | Gerado localmente (pode regenerar) |
| `VAPID_PRIVATE_KEY` | Gerado localmente (pode regenerar) |
| `SMTP_HOST` | Seu provedor de e-mail |
| `SMTP_PORT` | Seu provedor de e-mail |
| `SMTP_USER` | Seu provedor de e-mail |
| `SMTP_PASSWORD` | Seu provedor de e-mail |
| `SMTP_FROM_EMAIL` | Seu provedor de e-mail |
| `FIREBASE_SERVER_KEY` | Firebase Console (legacy) |
| `CRON_SECRET` | Pode gerar novo |

---

## Parte 4: Opções de Migração

### Opção A: Solicitar Transfer do Projeto (Recomendado)

1. **Contate o suporte Lovable** via Discord ou email
2. Solicite: "Transfer ownership of Supabase project zmsuqdwleyqpdthaqvbi to my Supabase account"
3. Forneça o e-mail da sua conta Supabase
4. Após transferência, você terá acesso total ao Dashboard

**Vantagens**: Mantém todos os dados, usuários, e configurações intactos

### Opção B: Exportar e Recriar

1. Eu posso gerar SQL completo de todas as tabelas
2. Você cria novo projeto Supabase
3. Importa estrutura + dados
4. Reconfigura secrets e Edge Functions

**Desvantagens**: Perde IDs de usuários (auth.users), precisa migrar manualmente

### Opção C: Conectar via API (Acesso Parcial)

Com a Anon Key você já pode:
- Ler dados públicos
- Executar operações como usuário autenticado
- Chamar Edge Functions

Não pode:
- Acessar dados de outros usuários
- Modificar estrutura do banco
- Ver logs do sistema

---

## Parte 5: O que eu Posso Fazer Agora

### Imediatamente Disponível
1. **Gerar SQL de schema** - Todas as tabelas com estrutura
2. **Exportar dados em JSON** - Via queries SELECT
3. **Documentar Edge Functions** - Código completo já no repositório
4. **Gerar script de migração** - SQL pronto para importar

### Requer Acesso Adicional
1. **Exportar auth.users** - Precisa SERVICE_ROLE_KEY
2. **Baixar arquivos Storage** - Precisa SERVICE_ROLE_KEY
3. **Acessar Dashboard** - Precisa transfer do projeto

---

## Próximos Passos Sugeridos

1. **Decidir caminho**: Transfer ou Exportar?
2. **Recuperar secrets**: Acesse Stripe, Google, SMTP
3. **Me avisar** para eu gerar os scripts necessários

Posso começar gerando:
- Script SQL completo de migração
- Documentação das Edge Functions
- Mapa de dependências entre tabelas

