# CLAUDE.md — resenha-cs (site)

@AI_RULES.md

---

## O que é este projeto

Site da resenha: login com a Steam, lobby, montagem de times, veto de mapas,
placar ao vivo e ranking com elo interno. Também **serve o instalador** do
Resenha Client em `/client/ResenhaClient-setup.exe`.

Faz parte de um sistema de três peças:

```
Navegador ──> resenha-cs-next (VOCÊ ESTÁ AQUI) ──┐
                                                  ├──> Turso (compartilhado)
CS2 ──GSI──> Resenha Client ──WebSocket──> resenha-backend (Render)
```

- **backend** (`backend-cs-resenha`): fonte de verdade da partida ao vivo.
  O site avisa o fim do veto e consulta o placar; **quem registra o resultado
  é o backend**, não este projeto.
- **client** (`client-resenha-cs`): app desktop que lê o CS2.

## Stack

Next.js 14.2 (App Router), React 18, **JS puro — sem TypeScript, por decisão**,
CSS global. Banco Turso (libSQL), **compartilhado com o backend**. Vercel.

## Estrutura

```
app/api/          rotas (uma pasta por endpoint)
app/lobby/[code]/ página do lobby
components/       home/ lobby/ layout/ player/ ui/  (por domínio)
hooks/            useLobby, useLiveMatch, useSession, useRanking, useFlashError
lib/              db, session, rotas, lobby, maps, times, codigos, leetify,
                  steam, backend, format, baseUrl, client, cx
public/client/    ResenhaClient-setup.exe (instalador servido no site)
```

## Regras de negócio

- Estados do lobby: `aguardando → draft → veto → pronto → finalizado |
  abandonado`. Os dois últimos são **terminais** (o polling para).
- Lotação 10. Só o dono inicia. **Entrar de novo num lobby já iniciado não é
  erro** — responde ok (o polling chama isso o tempo todo).
- Times: capitães (draft alternado) ou automático (`lib/times.js` balanceia por
  Premier, ou elo interno ×10). Com 2 jogadores o draft é pulado.
- Veto: ban alternado até sobrar 1 mapa. Pool em `lib/maps.js`.
- **O placar é registrado automaticamente pelo backend.** O formulário manual
  foi removido — não recrie.

## Princípios e padrões

Clean Code, SOLID, DRY, KISS e YAGNI — **até onde pagam**.

- **S**: cada módulo de `lib/` tem um assunto (`maps`, `times`, `codigos`,
  `lobby`, `rotas`). Grab-bag de utilidades não sobrevive à revisão.
- **O/I**: `rotaAutenticada` envelopa o que é comum; a rota fica só com a
  regra. **Não exporte o que só é usado dentro do próprio arquivo.**
- **DRY** vale para duplicação **real**; semelhança coincidente que muda por
  motivos diferentes fica separada.
- **KISS**: sem ORM e **sem TypeScript**, por decisão. Antes de introduzir uma
  camada, pergunte o que ela remove — não o que ela adiciona.
- **YAGNI**: a escala real é uma sala de 10 jogadores. Não construa para 10 mil.

**Adotados:** envelope/decorator (`rotaAutenticada`), componentes por domínio
com `ui/` como vocabulário visual, hooks para todo estado de servidor.

**Rejeitados de propósito** — não reintroduza sem argumentar o ganho concreto:
**Repository Pattern** (há um banco só e os testes são de integração contra
ele), **Service Layer** (as rotas têm ~20 linhas de regra) e **DTOs formais**
(o contrato é o objeto que a rota devolve, documentado no README).

## Regras deste projeto

**Rotas**

- Use o envelope `rotaAutenticada` de `lib/rotas.js`: garante usuário,
  normaliza o `code`, converte `erro(status, msg)` em resposta.
  **Não repita `currentUser()` + 401 na mão.**
- Erro sempre `{ erro: "mensagem" }`, em português e **para o jogador ler**
  ("Não é sua vez de banir.", "Lobby cheio (10 jogadores).").
- 400 inválido · 401 sem sessão · 403 sem permissão · 404 não existe ·
  409 conflito · 429 rate limit.
- Autorização **sempre no servidor**: só o dono inicia, só quem está na vez
  bana/escolhe, só quem está no lobby vê o placar ao vivo.

**Frontend**

- Componentes por domínio. `ui/` é só o vocabulário visual (Button, Panel,
  Tag, Avatar…). Componente de apresentação **não faz fetch**.
- `'use client'` só onde há estado, efeito ou evento.
- Estado terminal **para o polling**. Polling novo precisa de intervalo,
  checagem de `document.hidden` e limpeza no unmount.
- Toda ação que dispara requisição **desabilita o botão enquanto está em voo**
  — duplo clique já causou elo aplicado em dobro.
- CSS em `app/globals.css`. **Apagou componente, apague o CSS junto** — já
  ficou regra morta no bundle. Cuidado: classe montada dinamicamente
  (`` `tag-${tom}` ``) não aparece em busca por texto.

**Reuso antes de criar**

`lib/rotas.js` (envelope), `lib/codigos.js` (geração de código),
`lib/maps.js` (`nomeDoMapa`), `lib/times.js` (balanceamento),
`components/ui/`, `hooks/use*.js`.

## Banco de dados

- **Sempre parâmetros (`?`).** Nunca interpole valor em SQL.
- Escrita concorrente: `db.batch()` com a **guarda dentro de cada statement**
  (ver o registro de placar antigo — ler-depois-escrever causou elo em dobro).
- Compartilhado com o backend: tabela usada pelos dois precisa de **DDL
  idêntica** em `lib/db.js` e no `src/db.js` do backend.
- A Vercel é serverless: **estado em memória não é compartilhado** entre
  invocações. Não confie nele para nada crítico.

## Segurança

- Segredo nunca vai pro cliente. `BACKEND_INTERNAL_KEY` e chaves de API só em
  route handler / Server Component.
- Cookie: `httpOnly`, `sameSite: lax`, e `secure` **derivado do protocolo real**
  (`cookieOptionsFor`) — flag fixa quebra o login em túnel HTTP.
- Steam OpenID validado no servidor (`check_authentication`).

## Comandos

```bash
npm run dev
npx next build

node --env-file=.env test-flow.mjs   # fluxo completo do lobby
node --env-file=.env test-fixes.mjs  # regressões conhecidas
```

## Testes

Integração contra o sistema de verdade — **sem mocks, de propósito**.

- **Todo teste limpa o que criou**, em `finally`. Steamids falsos com prefixo
  `7656119800000000…`. Já houve jogador de teste vazando pro ranking.
- Use `process.exitCode`, **não** `process.exit()` — o exit mata o processo
  antes da limpeza rodar.
- O `.env` aponta para **produção**. Diagnóstico pode; escrita, só com
  limpeza garantida.

## Deploy

Vercel. **Site primeiro, backend depois** — este projeto publica o instalador
e o link; o backend é quem torna a atualização obrigatória. Inverter faz o app
mandar baixar algo que ainda não está no ar.

## Checklist antes de entregar

- [ ] `npx next build` limpo.
- [ ] `test-flow` e `test-fixes` passando.
- [ ] Caminho novo sem cobertura: exercitado à mão.
- [ ] Nada órfão: export, import, **CSS de componente apagado**.
- [ ] Dados de teste removidos do banco de produção.
- [ ] `next dev` encerrado.
- [ ] `.env.example` / README atualizados se for o caso.
- [ ] Nenhum segredo em código, log ou saída.
