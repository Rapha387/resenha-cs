// test-flow.js — simula 4 jogadores no fluxo completo (só pra teste local)
import crypto from 'crypto';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const SECRET = process.env.SESSION_SECRET;
const sign = v => `${v}.${crypto.createHmac('sha256', SECRET).update(v).digest('hex')}`;
const BASE = 'http://127.0.0.1:3000';

const FAKES = [
  { steamid: '76561198000000001', name: 'Raphael', premier: 14500 },
  { steamid: '76561198000000002', name: 'Cabra', premier: 9800 },
  { steamid: '76561198000000003', name: 'Zóio', premier: 12000 },
  { steamid: '76561198000000004', name: 'Neguin', premier: 7000 },
];

// Códigos dos lobbies criados durante o teste (pra limpeza no final).
const criados = [];

// Apaga tudo que o teste criou. Sem isso os 4 fakes ficavam pra sempre no
// banco apontado por TURSO_DATABASE_URL — inclusive no ranking, se alguém
// rodasse o teste apontando pra produção.
async function cleanup() {
  const ids = FAKES.map(f => f.steamid);
  const codes = criados.length ? criados : ['_NENHUM_'];
  const inIds = ids.map(() => '?').join(',');
  const inCodes = codes.map(() => '?').join(',');
  const stmts = [
    // live_matches/match_events são do backend dedicado — se BACKEND_URL
    // estiver configurada no dev, o veto cria partidas ao vivo pros lobbies
    // do teste. As tabelas podem nem existir; o try engole isso.
    { sql: `DELETE FROM match_events WHERE match_id IN (SELECT id FROM live_matches WHERE code IN (${inCodes}))`, args: codes },
    { sql: `DELETE FROM live_matches WHERE code IN (${inCodes})`, args: codes },
    { sql: `DELETE FROM vetoes WHERE code IN (${inCodes})`, args: codes },
    { sql: `DELETE FROM matches WHERE code IN (${inCodes})`, args: codes },
    { sql: `DELETE FROM lobby_players WHERE code IN (${inCodes})`, args: codes },
    { sql: `DELETE FROM lobbies WHERE code IN (${inCodes})`, args: codes },
    { sql: `DELETE FROM players WHERE steamid IN (${inIds})`, args: ids },
  ];
  for (const s of stmts) {
    try { await db.execute({ sql: s.sql, args: s.args }); } catch {}
  }
  console.log('✓ dados de teste removidos');
}

async function call(user, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `resenha_sid=${encodeURIComponent(sign(user.steamid))}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data.erro}`);
  return data;
}

(async () => {
  for (const f of FAKES) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO players (steamid, name, premier, elo, wins, losses, created)
            VALUES (?, ?, ?, 1000, 0, 0, ?)`,
      args: [f.steamid, f.name, f.premier, Date.now()],
    });
  }
  const [rapha, cabra, zoio, neguin] = FAKES;

  const { code } = await call(rapha, 'POST', '/api/lobby');
  criados.push(code);
  console.log('✓ lobby criado:', code);

  for (const f of [cabra, zoio, neguin]) await call(f, 'POST', `/api/lobby/${code}/join`);
  console.log('✓ 4 jogadores no lobby');

  // teste de segurança: não-dono tenta iniciar
  await call(cabra, 'POST', `/api/lobby/${code}/start`, { mode: 'auto' })
    .then(() => { throw new Error('FALHA: não-dono conseguiu iniciar!'); })
    .catch(e => { if (e.message.includes('403')) console.log('✓ só o dono inicia (403 ok)'); else throw e; });

  await call(rapha, 'POST', `/api/lobby/${code}/start`,
    { mode: 'capitaes', capA: rapha.steamid, capB: cabra.steamid });
  console.log('✓ draft iniciado (capitães: Raphael × Cabra)');

  // fora de vez
  await call(cabra, 'POST', `/api/lobby/${code}/pick`, { steamid: zoio.steamid })
    .then(() => { throw new Error('FALHA: pick fora de vez!'); })
    .catch(e => { if (e.message.includes('403')) console.log('✓ pick fora de vez bloqueado'); else throw e; });

  await call(rapha, 'POST', `/api/lobby/${code}/pick`, { steamid: zoio.steamid });
  await call(cabra, 'POST', `/api/lobby/${code}/pick`, { steamid: neguin.steamid });
  let s = await call(rapha, 'GET', `/api/lobby/${code}`);
  console.log('✓ draft completo → status:', s.lobby.status);

  // veto: bane 6, sobra 1
  const capitaes = [rapha, cabra];
  let i = 0;
  while (true) {
    s = await call(rapha, 'GET', `/api/lobby/${code}`);
    if (s.lobby.status !== 'veto') break;
    const banidos = s.vetoes.map(v => v.map);
    const alvo = s.maps.find(m => !banidos.includes(m.id));
    const quem = capitaes.find(c => c.steamid === s.lobby.turn);
    await call(quem, 'POST', `/api/lobby/${code}/ban`, { map: alvo.id });
    i++;
  }
  console.log(`✓ veto completo (${i} bans) → mapa:`, s.lobby.decider_map, '| status:', s.lobby.status);

  // O registro manual foi removido: o placar agora entra sozinho quando o
  // backend recebe o GAME_OVER do CS2 (coberto pelos testes do backend).
  await call(rapha, 'POST', `/api/lobby/${code}/result`, { scoreA: 13, scoreB: 9 })
    .then(() => { throw new Error('FALHA: rota de placar manual ainda existe!'); })
    .catch(e => { if (e.message.includes('404')) console.log('✓ registro manual removido (rota → 404)'); else throw e; });
  s = await call(rapha, 'GET', `/api/lobby/${code}`);
  console.log('✓ lobby segue pronto aguardando o fim da partida → status:', s.lobby.status);

  const rk = await (await fetch(BASE + '/api/ranking')).json();
  console.log('✓ ranking:', rk.ranking.map(p => `${p.name}(${p.elo})`).join(', '));

  // teste do modo automático de balanceamento
  const { code: code2 } = await call(rapha, 'POST', '/api/lobby');
  criados.push(code2);
  for (const f of [cabra, zoio, neguin]) await call(f, 'POST', `/api/lobby/${code2}/join`);
  await call(rapha, 'POST', `/api/lobby/${code2}/start`, { mode: 'auto' });
  s = await call(rapha, 'GET', `/api/lobby/${code2}`);
  const tA = s.players.filter(p => p.team === 'A').map(p => `${p.name}(${p.premier})`);
  const tB = s.players.filter(p => p.team === 'B').map(p => `${p.name}(${p.premier})`);
  console.log('✓ auto-balance → A:', tA.join(','), '| B:', tB.join(','), '| status:', s.lobby.status);

  console.log('\nTUDO PASSOU ✔');
})()
  .catch(e => { console.error('✗', e.message); process.exitCode = 1; })
  .finally(cleanup); // process.exit(1) aqui mataria o processo antes da limpeza
