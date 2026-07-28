// lib/game.js — regras do jogo
import crypto from 'crypto';
import { db } from './db';
import { fetchStats } from './leetify';

// ====== MAP POOL (edite aqui se a Valve mudar o Active Duty) ======
export const MAPS = [
  { id: 'de_ancient', nome: 'Ancient' },
  { id: 'de_anubis', nome: 'Anubis' },
  { id: 'de_dust2', nome: 'Dust II' },
  { id: 'de_inferno', nome: 'Inferno' },
  { id: 'de_mirage', nome: 'Mirage' },
  { id: 'de_nuke', nome: 'Nuke' },
  { id: 'de_train', nome: 'Train' },
];
// ==================================================================

export function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}

export function playerScore(p) {
  if (p.premier) return p.premier;
  return (p.elo || 1000) * 10;
}

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

export async function refreshStats(steamid) {
  try {
    const s = await fetchStats(steamid);
    if (!s) return false;
    await db.prepare(`UPDATE players SET premier = ?, leetify_rating = ?, aim = ?, utility = ?,
                hs_pct = ?, winrate = ?, stats_json = ?, stats_updated = ? WHERE steamid = ?`)
      .run(s.premier, s.leetify_rating, s.aim, s.utility, s.hs_pct, s.winrate,
           JSON.stringify(s.raw).slice(0, 200000), Date.now(), steamid);
    return true;
  } catch (err) {
    console.error('Leetify falhou para', steamid, err.message);
    return false;
  }
}
