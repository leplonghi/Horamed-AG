# 🚀 Instruções de Deploy das Otimizações

As otimizações de código forma aplicadas com sucesso! Agora é necessário atualizar a infraestrutura do Firebase para que as novas queries rápidas funcionem.

## 1. Atualizar Índices do Firestore

Execute o comando abaixo no terminal para criar os novos índices compostos. Isso vai acabar com os avisos de "requires an index" e acelerar o carregamento.

```bash
firebase deploy --only firestore:indexes
```

Tempo estimado: 2-5 minutos (o Firebase processa em segundo plano).

## 2. Verificar Build

Como alteramos configurações de cache e adicionamos um utilitário de compressão, é bom validar se o build de produção continua passando:

```bash
npm run build
```

## Resumo das Alterações Feitas

1.  **Cache Inteligente:** Configurado `staleTime` de 10 minutos. O app fará muito menos requisições, economizando quota do Firebase e bateria.
2.  **Compressão de Imagens:** Uploads no Cofre agora são comprimidos automaticamente (máx 1MB/1920px) usando Canvas API nativa (sem bibliotecas pesadas).
3.  **Índices Compostos:** Adicionados índices para `healthDocuments` e `healthEvents` para suportar ordenação e filtros rápidos.

---
**Status:** ✅ Código pronto para produção.
