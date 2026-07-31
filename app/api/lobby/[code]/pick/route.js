import { db } from '@/lib/db';
import { rotaAutenticada, carregarLobby, corpoJson, erro } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

export const POST = rotaAutenticada(async ({ user, code, request }) => {
  const { steamid } = await corpoJson(request);
  const lobby = await carregarLobby(code, 'draft', 'Não é hora de draft.');

  if (lobby.turn !== user.steamid) throw erro(403, 'Não é sua vez de escolher.');

  const alvo = await db.prepare('SELECT * FROM lobby_players WHERE code = ? AND steamid = ?').get(code, steamid);
  if (!alvo || alvo.team) throw erro(400, 'Jogador indisponível.');

  const meuTime = lobby.turn === lobby.cap_a ? 'A' : 'B';
  await db.prepare('UPDATE lobby_players SET team = ? WHERE code = ? AND steamid = ?').run(meuTime, code, steamid);

  const semTime = (await db.prepare(
    'SELECT COUNT(*) c FROM lobby_players WHERE code = ? AND team IS NULL'
  ).get(code)).c;

  if (semTime === 0) {
    await db.prepare('UPDATE lobbies SET status = ?, turn = ? WHERE code = ?').run('veto', lobby.cap_a, code);
  } else {
    const proximo = lobby.turn === lobby.cap_a ? lobby.cap_b : lobby.cap_a;
    await db.prepare('UPDATE lobbies SET turn = ? WHERE code = ?').run(proximo, code);
  }

  return { ok: true };
});
