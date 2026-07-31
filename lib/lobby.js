// lib/lobby.js — leitura do estado do lobby (o que a tela precisa) e geração
// do código de convite.
import { db } from './db';
import { MAPS } from './maps';
import { gerarCodigo, TAMANHO_CODIGO_LOBBY } from './codigos';

export const genCode = () => gerarCodigo(TAMANHO_CODIGO_LOBBY);

/** Tudo que a página do lobby renderiza, numa consulta só. */
export async function lobbyState(code) {
  const lobby = await db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby) return null;

  const [players, vetoes, match] = await Promise.all([
    db.prepare(`
      SELECT p.steamid, p.name, p.avatar, p.premier, p.leetify_rating, p.aim, p.utility,
             p.hs_pct, p.elo, p.wins, p.losses, lp.team
      FROM lobby_players lp JOIN players p ON p.steamid = lp.steamid
      WHERE lp.code = ? ORDER BY lp.joined`).all(code),
    db.prepare('SELECT map, banned_by, ord FROM vetoes WHERE code = ? ORDER BY ord').all(code),
    db.prepare('SELECT * FROM matches WHERE code = ? ORDER BY id DESC LIMIT 1').get(code),
  ]);

  return { lobby, players, vetoes, maps: MAPS, match: match || null };
}
