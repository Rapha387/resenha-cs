# Resenha CS v2 — Next.js + React

Site pra organizar o 5x5 do grupo: login via Steam, nome e avatar reais puxados da Steam, stats da Leetify, montagem de times (draft de capitães ou balanceamento automático), veto de mapas ao vivo e ranking interno com elo.

## Novidades da v2

- **Reescrito em Next.js 14 + React 18** (App Router)
- **Nome bonitinho garantido**: agora o nome e o avatar vêm do perfil público da Steam mesmo **sem** `STEAM_API_KEY` configurada (a chave virou opcional). Adeus "Player 1232".
- Na primeira vez que o servidor sobe, ele **conserta sozinho** os nomes genéricos que ficaram salvos da versão antiga.
- Botão "Atualizar nome e stats" no perfil agora atualiza a Steam **e** a Leetify.
- Bugs corrigidos:
  - Partida 1x1 (só 2 jogadores no modo capitães) travava no draft sem ninguém pra escolher → agora pula direto pro veto
  - Entrar de novo (pelo link) num lobby já iniciado dava erro → agora reconhece que você já tá dentro
  - Elo podia ficar negativo → agora o mínimo é 0
  - Registro de placar agora é atômico (transação): ou grava tudo, ou nada

## O que precisa ter instalado

- **Node.js 18.17 ou mais novo** — https://nodejs.org (versão LTS)

## Como rodar

```
npm install
npm run build
npm start
```

Abra http://localhost:3000 e clique em **Entrar com a Steam**. O banco (`resenha.db`) é criado sozinho.

Pra desenvolver/mexer no código, use `npm run dev` (recarrega sozinho a cada mudança).

**Opcional:** copie `.env.example` pra `.env.local` e preencha a `STEAM_API_KEY` (grátis em https://steamcommunity.com/dev/apikey). Sem ela o site funciona normal; com ela, a busca de nome/avatar usa a API oficial (um pouco mais confiável que o perfil público, que precisa estar visível).

> Se o nickname de alguém aparecer errado: perfil privado na Steam esconde o XML público. A pessoa configura o perfil como público, ou você adiciona a `STEAM_API_KEY` — com a chave funciona até com perfil privado.

## Como os amigos acessam

O login da Steam exige que todo mundo use o **mesmo endereço** do `BASE_URL` no `.env.local`:

**Opção A — Cloudflare Tunnel (recomendado, grátis, sem mexer no roteador):**
```
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```
Ele gera um link `https://....trycloudflare.com`. Coloque no `BASE_URL`, reinicie (`npm start`) e mande o link no grupo.

**Opção B — Tailscale/Radmin VPN:** `BASE_URL=http://SEU_IP_DA_VPN:3000`.

**Opção C — Port forward:** lembrando que IP da Claro costuma ser CGNAT, aí só com A ou B.

## Stats da Leetify

Cada jogador cria conta grátis em https://leetify.com com a própria Steam. Os stats são buscados no primeiro login e pelo botão "Atualizar nome e stats". Quem não tiver Leetify joga igual — o balanceamento usa o elo interno.

> A API pública da Leetify pode mudar de formato. Se os stats sumirem, o lugar pra ajustar é `lib/leetify.js`.

## Map pool mudou?

Edite a lista `MAPS` em `lib/game.js`.

## Testar a instalação

Com o servidor rodando, em outro terminal:

```
node test-flow.mjs     # simula 4 jogadores: lobby → draft → veto → placar
node test-fixes.mjs    # valida as correções de bug
```

Depois apague o `resenha.db` pra zerar os jogadores falsos antes de usar de verdade.

## Fluxo da resenha

1. Alguém cria o lobby e manda o código de 5 letras no grupo
2. Todo mundo entra (máx. 10)
3. O dono escolhe: **draft de capitães** ou **automático** (times equilibrados pelos ratings)
4. Capitães fazem o **veto**: ban alternado até sobrar 1 mapa
5. Criem o lobby no CS2 com o mapa decidido e joguem
6. O dono registra o placar → elo atualiza (+25/−25, mínimo 0) e o ranking mostra quem carrega e quem passeia
