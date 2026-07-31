import { db } from '@/lib/db';
import { montarTimesEquilibrados } from '@/lib/times';
import { rotaAutenticada, carregarLobby, corpoJson, erro } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

const MIN_JOGADORES = 2;

export const POST = rotaAutenticada(async ({ user, code, request }) => {
  const { mode, capA, capB } = await corpoJson(request);
  const lobby = await carregarLobby(code, 'aguardando', 'Lobby já iniciado.');

  if (lobby.owner !== user.steamid) throw erro(403, 'Só quem criou o lobby pode iniciar.');

  const jogadores = await db.prepare('SELECT steamid FROM lobby_players WHERE code = ?').all(code);
  if (jogadores.length < MIN_JOGADORES) {
    throw erro(400, `Precisa de pelo menos ${MIN_JOGADORES} jogadores.`);
  }

  return mode === 'auto'
    ? iniciarAutomatico(code, jogadores)
    : iniciarPorCapitaes(code, capA, capB);
});

/** Times equilibrados pelo rating; os melhores de cada lado viram capitães. */
async function iniciarAutomatico(code, jogadores) {
  const perfis = await Promise.all(
    jogadores.map((p) => db.prepare('SELECT * FROM players WHERE steamid = ?').get(p.steamid))
  );

  await db.batch(
    montarTimesEquilibrados(perfis).map(({ steamid, team }) => ({
      sql: 'UPDATE lobby_players SET team = ? WHERE code = ? AND steamid = ?',
      args: [team, code, steamid],
    }))
  );

  const melhorDo = (time) => db.prepare(`
    SELECT lp.steamid FROM lobby_players lp JOIN players p ON p.steamid = lp.steamid
    WHERE lp.code = ? AND lp.team = ? ORDER BY COALESCE(p.premier, p.elo * 10) DESC LIMIT 1`
  ).get(code, time);

  const [capitaoA, capitaoB] = await Promise.all([melhorDo('A'), melhorDo('B')]);
  await db.prepare('UPDATE lobbies SET status = ?, mode = ?, cap_a = ?, cap_b = ?, turn = ? WHERE code = ?')
    .run('veto', 'auto', capitaoA.steamid, capitaoB.steamid, capitaoA.steamid, code);

  return { ok: true, proximo: 'veto' };
}

/** Capitães escolhidos na mão; eles montam os times no draft. */
async function iniciarPorCapitaes(code, capA, capB) {
  if (!capA || !capB || capA === capB) throw erro(400, 'Escolha dois capitães diferentes.');

  const noLobby = (id) => db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?').get(code, id);
  const [temA, temB] = await Promise.all([noLobby(capA), noLobby(capB)]);
  if (!temA || !temB) throw erro(400, 'Os capitães precisam estar no lobby.');

  const atribuir = 'UPDATE lobby_players SET team = ? WHERE code = ? AND steamid = ?';
  await db.batch([
    { sql: atribuir, args: ['A', code, capA] },
    { sql: atribuir, args: ['B', code, capB] },
  ]);

  // Com exatamente 2 jogadores (só os capitães) o draft não tem ninguém pra
  // escolher — pula direto pro veto (bug da v1).
  const { c: semTime } = await db.prepare(
    'SELECT COUNT(*) c FROM lobby_players WHERE code = ? AND team IS NULL'
  ).get(code);
  const proximo = semTime === 0 ? 'veto' : 'draft';

  await db.prepare('UPDATE lobbies SET status = ?, mode = ?, cap_a = ?, cap_b = ?, turn = ? WHERE code = ?')
    .run(proximo, 'capitaes', capA, capB, capA, code);

  return { ok: true, proximo };
}
