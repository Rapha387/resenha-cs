import { db } from '@/lib/db';
import { genCode } from '@/lib/lobby';
import { rotaAutenticada } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

export const POST = rotaAutenticada(async ({ user }) => {
  let code = genCode();
  while (await db.prepare('SELECT code FROM lobbies WHERE code = ?').get(code)) code = genCode();

  const agora = Date.now();
  await db.batch([
    {
      sql: 'INSERT INTO lobbies (code, owner, status, created) VALUES (?, ?, ?, ?)',
      args: [code, user.steamid, 'aguardando', agora],
    },
    {
      // Quem cria já entra: o dono nunca precisa "entrar" no próprio lobby.
      sql: 'INSERT INTO lobby_players (code, steamid, joined) VALUES (?, ?, ?)',
      args: [code, user.steamid, agora],
    },
  ]);

  return { code };
});
