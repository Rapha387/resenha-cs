import { db } from '@/lib/db';
import { MAPS } from '@/lib/maps';
import { notifyBackend } from '@/lib/backend';
import { rotaAutenticada, carregarLobby, corpoJson, erro } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

export const POST = rotaAutenticada(async ({ user, code, request }) => {
  const { map } = await corpoJson(request);
  const lobby = await carregarLobby(code, 'veto', 'Não é hora de veto.');

  if (lobby.turn !== user.steamid) throw erro(403, 'Não é sua vez de banir.');
  if (!MAPS.find((m) => m.id === map)) throw erro(400, 'Mapa inválido.');

  const banidos = (await db.prepare('SELECT map FROM vetoes WHERE code = ?').all(code)).map((v) => v.map);
  if (banidos.includes(map)) throw erro(400, 'Esse mapa já foi banido.');

  // OR IGNORE + rowsAffected fecha a corrida do duplo clique: dois POSTs do
  // mesmo ban chegavam juntos, os dois passavam no check acima e o segundo
  // INSERT estourava a PRIMARY KEY (code, map) — erro 500 na tela do capitão.
  const ins = await db.prepare('INSERT OR IGNORE INTO vetoes (code, map, banned_by, ord) VALUES (?, ?, ?, ?)')
    .run(code, map, user.steamid, banidos.length + 1);
  if (Number(ins.rowsAffected) === 0) throw erro(400, 'Esse mapa já foi banido.');

  const restantes = MAPS.filter((m) => !banidos.includes(m.id) && m.id !== map);
  if (restantes.length === 1) {
    await db.prepare('UPDATE lobbies SET status = ?, decider_map = ?, turn = NULL WHERE code = ?')
      .run('pronto', restantes[0].id, code);
    // Veto encerrado: o backend dedicado manda START_MATCH pros Resenha Clients
    await notifyBackend('/internal/match/start', { code });
  } else {
    const proximo = lobby.turn === lobby.cap_a ? lobby.cap_b : lobby.cap_a;
    await db.prepare('UPDATE lobbies SET turn = ? WHERE code = ?').run(proximo, code);
  }

  return { ok: true };
});
