# Prevenção de Problemas de Internacionalização (i18n)

Este documento descreve as práticas e ferramentas para garantir que o aplicativo HoraMed mantenha uma internacionalização completa e livre de erros.

## 🚨 O Problema
Erros comuns de i18n incluem:
1. Usar texto *hardcoded* diretamente nos componentes (ex: `<h1>Olá</h1>` ao invés de `<h1>{t('hello')}</h1>`).
2. Adicionar chamadas `t('chave')` no código mas esquecer de definir a chave no `LanguageContext.tsx`.
3. Erros de digitação nas chaves (`t('btn_save')` vs `'btn.save'`).

## 🛡️ Solução Automatizada

Criamos um script de auditoria que varre todo o código fonte em busca de usos de `t()` e verifica se todas as chaves estão definidas no dicionário de tradução.

### Como rodar o verificador:

```bash
npm run i18n:check
```

**Output esperado:**
- ✅ Lista de chaves definidas.
- 🔎 Lista de chaves usadas.
- ❌ **ERROS:** Lista de chaves usadas mas não definidas.

### Quando rodar:
- **Sempre** antes de submeter um Pull Request.
- **Antes** de qualquer build de produção (`npm run build`).

## 📝 Guia para Desenvolvedores

1. **Adicionar nova tradução:**
   - Adicione a chave e o texto em **Português** e **Inglês** no arquivo `src/contexts/LanguageContext.tsx`.
   - Mantenha as seções organizadas (ex: chaves de `auth.*` juntas).

2. **Usar no componente:**
   - Use o hook `useLanguage`:
     ```tsx
     const { t } = useLanguage();
     return <Button>{t('auth.login')}</Button>;
     ```

3. **Evitar:**
   - Fallbacks no código (`t('key') || 'Texto'`). **Defina a chave no contexto!**
   - Concatenação de strings complexas. Use interpolação se necessário (embora o sistema atual seja simples).

## 🚫 Regra de Ouro
**Nenhum texto visível ao usuário deve estar hardcoded em arquivos `.tsx`.**

---
*Gerado pelo Agente Antigravity - 01/02/2026*
