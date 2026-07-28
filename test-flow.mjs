// test-flow.js — simula 4 jogadores no fluxo completo (só pra teste local)
import crypto from 'crypto';
import fs from 'fs';
import Database from 'better-sqlite3';
const db = new Database('resenha.db');

const SECRET = fs.readFileSync('.session-secret', 'utf8').trim();
const sign = v => `${v}.${crypto.createHmac('sha256', SECRET).update(v).digest('hex')}`;
const BASE = 'http://127.0.0.1:3000';

const FAKES = [
  { steamid: '76561198000000001', name: 'Raphael', premier: 14500 },
  { steamid: '76561198000000002', name: 'Cabra', premier: 9800 },
  { steamid: '76561198000000003', name: 'Zóio', premier: 12000 },
  { steamid: '76561198000000004', name: 'Neguin', premier: 7000 },
];

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
    db.prepare(`INSERT OR REPLACE INTO players (steamid, name, premier, elo, wins, losses, created)
                VALUES (?, ?, ?, 1000, 0, 0, ?)`).run(f.steamid, f.name, f.premier, Date.now());
  }
  const [rapha, cabra, zoio, neguin] = FAKES;

  const { code } = await call(rapha, 'POST', '/api/lobby');
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

  await call(rapha, 'POST', `/api/lobby/${code}/result`, { scoreA: 13, scoreB: 9 });
  s = await call(rapha, 'GET', `/api/lobby/${code}`);
  console.log('✓ placar registrado → status:', s.lobby.status,
    '| placar:', s.match.score_a + 'x' + s.match.score_b);

  const rk = await (await fetch(BASE + '/api/ranking')).json();
  console.log('✓ ranking:', rk.ranking.map(p => `${p.name}(${p.elo})`).join(', '));

  // teste do modo automático de balanceamento
  const { code: code2 } = await call(rapha, 'POST', '/api/lobby');
  for (const f of [cabra, zoio, neguin]) await call(f, 'POST', `/api/lobby/${code2}/join`);
  await call(rapha, 'POST', `/api/lobby/${code2}/start`, { mode: 'auto' });
  s = await call(rapha, 'GET', `/api/lobby/${code2}`);
  const tA = s.players.filter(p => p.team === 'A').map(p => `${p.name}(${p.premier})`);
  const tB = s.players.filter(p => p.team === 'B').map(p => `${p.name}(${p.premier})`);
  console.log('✓ auto-balance → A:', tA.join(','), '| B:', tB.join(','), '| status:', s.lobby.status);

  console.log('\nTUDO PASSOU ✔');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
