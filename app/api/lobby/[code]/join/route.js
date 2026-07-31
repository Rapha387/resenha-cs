import { db } from '@/lib/db';
import { rotaAutenticada, carregarLobby, erro } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

const LOTACAO = 10;

export const POST = rotaAutenticada(async ({ user, code }) => {
  // Uma consulta só do lobby: o estado exigido depende de já estar dentro ou
  // não, então a checagem vem depois — não dá pra delegar pro carregarLobby.
  const lobby = await carregarLobby(code);

  // Já está dentro: responde ok em vez de erro (corrige loop da v1, e deixa
  // o polling do lobby chamar isso à vontade).
  const dentro = await db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?')
    .get(code, user.steamid);
  if (dentro) return { code };

  if (lobby.status !== 'aguardando') throw erro(400, 'A partida já começou nesse lobby.');

  const { c: total } = await db.prepare('SELECT COUNT(*) c FROM lobby_players WHERE code = ?').get(code);
  if (total >= LOTACAO) throw erro(400, `Lobby cheio (${LOTACAO} jogadores).`);

  await db.prepare('INSERT INTO lobby_players (code, steamid, joined) VALUES (?, ?, ?)')
    .run(code, user.steamid, Date.now());
  return { code };
});
