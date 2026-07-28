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
  - **Banco migrado pra Turso (libSQL)**: o SQLite em arquivo quebrava na Vercel
    (`SQLITE_CANTOPEN` — disco somente-leitura) e, mesmo no `/tmp`, os dados não
    eram compartilhados entre as instâncias
  - **Login da Steam** voltava pro domínio único do deploy em vez do domínio de
    verdade, gravando o cookie no lugar errado → agora o endereço é detectado
    do próprio request

## O que precisa ter instalado

- **Node.js 18.17 ou mais novo** — https://nodejs.org (versão LTS)
- Uma conta grátis no **Turso** — https://turso.tech (é o banco de dados)

## Banco de dados (Turso)

O projeto usa Turso (libSQL, mesmo dialeto do SQLite) acessado por HTTP. Não é
um arquivo local: em hospedagem serverless (Vercel) o disco é somente-leitura e
o `/tmp` não é compartilhado entre requisições, então um arquivo `.db` não
funciona lá.

Crie o banco e pegue as credenciais:

```
turso db create resenha-cs
turso db show resenha-cs --url        # -> TURSO_DATABASE_URL
turso db tokens create resenha-cs     # -> TURSO_AUTH_TOKEN
```

As tabelas são criadas sozinhas na primeira requisição.

## Como rodar

```
npm install
cp .env.example .env.local    # preencha as variáveis obrigatórias
npm run build
npm start
```

Abra http://localhost:3000 e clique em **Entrar com a Steam**.

Pra desenvolver/mexer no código, use `npm run dev` (recarrega sozinho a cada mudança).

## Variáveis de ambiente

| Variável | Obrigatória? | Pra que serve |
|---|---|---|
| `TURSO_DATABASE_URL` | **sim** | endereço do banco |
| `TURSO_AUTH_TOKEN` | **sim** | token de acesso ao banco |
| `SESSION_SECRET` | **sim** | assina o cookie de login (`openssl rand -hex 32`) |
| `BASE_URL` | não | força um endereço fixo; por padrão é detectado do próprio request |
| `STEAM_API_KEY` | não | usa a API oficial da Steam pro nome/avatar |

Sobre a `STEAM_API_KEY` (grátis em https://steamcommunity.com/dev/apikey): sem
ela o site funciona normal, puxando nome e avatar do perfil público. Com ela,
funciona até com perfil privado.

> **`SESSION_SECRET` é obrigatória em produção.** Sem ela, cada instância
> serverless geraria um segredo diferente e os jogadores seriam deslogados
> aleatoriamente — por isso o app falha explicitamente em vez de improvisar.

> Se o nickname de alguém aparecer errado: perfil privado na Steam esconde o XML público. A pessoa configura o perfil como público, ou você adiciona a `STEAM_API_KEY` — com a chave funciona até com perfil privado.

## Como os amigos acessam

**Opção A — Vercel (recomendado):** faça o deploy e configure as variáveis de
ambiente da tabela acima em *Settings → Environment Variables*. Não precisa de
`BASE_URL`: o endereço é detectado do próprio request, o que funciona tanto no
domínio de produção quanto nos previews.

**Opção B — Cloudflare Tunnel (rodando no seu PC, sem mexer no roteador):**
```
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```
Ele gera um link `https://....trycloudflare.com`. Mande no grupo — também
funciona sem `BASE_URL`.

**Opção C — Tailscale/Radmin VPN:** `BASE_URL=http://SEU_IP_DA_VPN:3000`.

## Stats da Leetify

Cada jogador cria conta grátis em https://leetify.com com a própria Steam. Os stats são buscados no primeiro login e pelo botão "Atualizar nome e stats". Quem não tiver Leetify joga igual — o balanceamento usa o elo interno.

> A API pública da Leetify pode mudar de formato. Se os stats sumirem, o lugar pra ajustar é `lib/leetify.js`.

## Map pool mudou?

Edite a lista `MAPS` em `lib/game.js`.

## Testar a instalação

Com o servidor rodando, em outro terminal (os scripts leem as mesmas variáveis
de ambiente do app):

```
node test-flow.mjs     # simula 4 jogadores: lobby → draft → veto → placar
node test-fixes.mjs    # valida as correções de bug
```

Eles criam jogadores falsos (steamids começando com `7656119800000000`). Aponte
para um banco de testes separado, ou apague essas linhas depois:

```
turso db shell resenha-cs "DELETE FROM players WHERE steamid LIKE '7656119800000000%'"
```

## Resenha Client (app desktop)

O perfil tem o botão **"Conectar Resenha Client"**: gera um código de 6
caracteres (uso único, expira em 5 min, tabela `client_pair_codes`) que o
usuário digita no app desktop. O backend dedicado (a implementar) troca esse
código por access/refresh tokens em `POST /api/client/auth/pair`, validando na
mesma tabela — ver o README do `resenha-client` pro contrato completo.

## Fluxo da resenha

1. Alguém cria o lobby e manda o código de 5 letras no grupo
2. Todo mundo entra (máx. 10)
3. O dono escolhe: **draft de capitães** ou **automático** (times equilibrados pelos ratings)
4. Capitães fazem o **veto**: ban alternado até sobrar 1 mapa
5. Criem o lobby no CS2 com o mapa decidido e joguem
6. O dono registra o placar → elo atualiza (+25/−25, mínimo 0) e o ranking mostra quem carrega e quem passeia
