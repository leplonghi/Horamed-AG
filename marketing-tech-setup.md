# ⚙️ SETUP TÉCNICO DE MARKETING (Deep Links & Tracking)

> **Objetivo**: Garantir que links de indicação funcionem perfeitamente e sejam rastreados.

---

## 1. RASTREAMENTO DE LINKS (Deep Linking)

Como estamos usando PWA primeiro, a estrutura de links é simples:
`https://horamed.com/auth?ref=CODIGO`

**O que já está feito:**
✅ Página de Login/Cadastro (`Auth.tsx`) já detecta `?ref=xxx`.
✅ Manifesto PWA atualizado com atalho "Indique e Ganhe".

**O que você precisa fazer (Hospedagem):**
1.  Garanta que seu domínio (ex: `horamed.com`) está configurado no hosting (Vercel/Netlify/Firebase).
2.  Para PWA, não precisa de configuração extra complexa agora.

**Futuro (App Nativo iOS/Android):**
Quando lançar na loja, você precisará criar os arquivos:
*   `/.well-known/assetlinks.json` (Android)
*   `/.well-known/apple-app-site-association` (iOS)

---

## 2. ANALYTICS (Setup Essencial)

Para medir o sucesso do marketing, você precisa ver os dados.

**Google Analytics 4 (GA4):**
1.  Crie uma propriedade no GA4.
2.  Pegue o ID (ex: `G-XXXXXXXX`).
3.  Adicione no seu `.env`:
    ```
    VITE_GA_MEASUREMENT_ID=G-XXXXXXXX
    ```

**Firebase Analytics:**
Já está integrado no projeto. Apenas verifique no Console do Firebase se o Analytics está "Ativado".

---

## 3. PIXEL DE CONVERSÃO (Para Ads Futuros)

Mesmo sem rodar ads hoje, instale os pixels para "aquecer" o público.

**Meta Pixel (Facebook/Instagram):**
1.  Crie um Pixel no Business Manager.
2.  Adicione no `index.html` (dentro do `<head>`).

**TikTok Pixel:**
1.  Crie no TikTok Ads Manager.
2.  Adicione no `index.html`.

---

## ✅ CHECKLIST TÉCNICO FINAL

- [ ] Domínio `horamed.com` (ou similar) conectado e com SSL (HTTPS).
- [ ] Analytics recebendo dados (teste abrindo o site em aba anônima).
- [ ] Teste de Indicação:
    1.  Abra uma aba anônima.
    2.  Entre em `seunsite.com/auth?ref=TESTE123`.
    3.  Veja se o código aparece preenchido (se implementamos o input manual visível) ou se o fluxo segue sem erro.

**Tudo pronto tecnicamente! Agora é só trazer tráfego.** 🚀
