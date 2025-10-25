# Sistema de Feature Flags - HoraMed

## Visão Geral

O HoraMed utiliza um sistema de feature flags para controlar funcionalidades em produção. Todas as flags são armazenadas no banco de dados (tabela `feature_flags`) e **estão DESABILITADAS por padrão**.

## Flags Disponíveis

| Flag | Status Padrão | Descrição | Impacto |
|------|---------------|-----------|---------|
| `badges` | 🔴 OFF | Gamificação complexa com badges Bronze/Prata/Ouro/Diamante | Remove seção de conquistas da UI |
| `emergency` | 🔴 OFF | Modo emergência guiada e ajuste de dose | Desabilita rota `/emergencia` e edge function |
| `prices` | 🔴 OFF | Pesquisa de preços em farmácias | Desabilita rota `/farmacia` e edge function |
| `advancedDash` | 🔴 OFF | Dashboards e gráficos avançados | Limita funcionalidade da página `/graficos` |
| `interactions` | 🔴 OFF | Análise de interações medicamentosas | Desabilita edge function `analyze-drug-interactions` |
| `aiStreaming` | 🔴 OFF | Streaming token-by-token de IA | IA responde em bloco único |

## Como Usar

### Frontend (React)

```typescript
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

function MyComponent() {
  const { isEnabled, flags, loading } = useFeatureFlags();

  if (!isEnabled('badges')) {
    return null; // Ou componente alternativo
  }

  return <div>Funcionalidade habilitada</div>;
}
```

### Verificar Flags Múltiplas

```typescript
const { isEnabled } = useFeatureFlags();

const showAdvancedFeatures = isEnabled('advancedDash') && isEnabled('interactions');
```

## Habilitar/Desabilitar Flags

### Via SQL (Supabase)

```sql
-- Habilitar uma flag
UPDATE feature_flags 
SET enabled = true 
WHERE key = 'badges';

-- Desabilitar uma flag
UPDATE feature_flags 
SET enabled = false 
WHERE key = 'emergency';

-- Verificar status atual
SELECT key, enabled, config 
FROM feature_flags 
ORDER BY key;
```

### Via Supabase Dashboard

1. Acesse o Lovable Cloud (Backend)
2. Navegue até `Table Editor` > `feature_flags`
3. Edite a coluna `enabled` da flag desejada
4. Altere para `true` (habilitar) ou `false` (desabilitar)
5. Salve a mudança

**⚠️ IMPORTANTE**: Alterações são aplicadas **instantaneamente** para todos os usuários na próxima requisição.

## Rollout Seguro

### Estratégia de Ativação Progressiva

```sql
-- 1. Teste interno (dev/staging)
-- Mantenha flags OFF em produção

-- 2. Beta limitado
-- Habilite para usuários específicos via lógica customizada

-- 3. Rollout completo
UPDATE feature_flags SET enabled = true WHERE key = 'nome_da_flag';
```

### Rollback de Emergência

```sql
-- Desabilitar imediatamente em caso de problemas
UPDATE feature_flags 
SET enabled = false 
WHERE key = 'flag_com_problema';
```

## Edge Functions Afetadas

| Edge Function | Flag Relacionada | Comportamento |
|---------------|------------------|---------------|
| `analyze-drug-interactions` | `interactions` | Retorna erro se flag OFF |
| `emergency-guidance` | `emergency` | Retorna erro se flag OFF |
| `pharmacy-prices` | `prices` | Retorna erro se flag OFF |
| `health-assistant` | `aiStreaming` | Resposta em bloco (sem streaming) |

## Rotas Protegidas

As seguintes rotas verificam feature flags:

- `/emergencia` → Requer `emergency` ON
- `/farmacia` → Requer `prices` ON
- `/graficos` → Funcionalidade limitada se `advancedDash` OFF

## Monitoramento

### Verificar Logs de Flags

```typescript
// No console do navegador
console.log(window.__FEATURE_FLAGS);
```

### Métricas Recomendadas

- Taxa de adoção de features (quando habilitadas)
- Erros relacionados a flags desabilitadas
- Performance antes/depois de habilitar

## Adicionando Novas Flags

1. **Inserir no banco**:
```sql
INSERT INTO feature_flags (key, enabled, config) 
VALUES ('nova_feature', false, '{"description": "Descrição da feature"}');
```

2. **Atualizar TypeScript**:
```typescript
// src/hooks/useFeatureFlags.ts
interface FeatureFlags {
  // ... flags existentes
  nova_feature: boolean;
}
```

3. **Implementar no código**:
```typescript
if (!isEnabled('nova_feature')) {
  return <PlaceholderComponent />;
}
```

## Considerações de Segurança

- ✅ Flags são lidas do banco (não hardcoded)
- ✅ RLS permite leitura pública (flags não são sensíveis)
- ✅ Apenas admin pode modificar via SQL direto
- ⚠️ Não use flags para controle de acesso (use RLS/subscriptions)

## FAQ

**P: Posso ter flags por usuário?**  
R: Atualmente não. As flags são globais. Para controle por usuário, use o sistema de subscriptions.

**P: O cache afeta as flags?**  
R: Não, o hook `useFeatureFlags` busca do banco em tempo real.

**P: Como testo uma flag localmente?**  
R: Atualize diretamente no Lovable Cloud (Backend) ou use SQL local.

## Próximos Passos

- [ ] Adicionar flag `cofre_ocr` para OCR de documentos
- [ ] Adicionar flag `familia` para modo família
- [ ] Implementar flags por ambiente (dev/staging/prod)
- [ ] Dashboard de gerenciamento de flags no admin
