import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const code = params.code.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const scoreA = parseInt(body.scoreA, 10);
  const scoreB = parseInt(body.scoreB, 10);

  const lobby = db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby || lobby.status !== 'pronto')
    return NextResponse.json({ erro: 'A partida ainda não está pronta.' }, { status: 400 });
  if (lobby.owner !== user.steamid)
    return NextResponse.json({ erro: 'Só quem criou o lobby registra o placar.' }, { status: 403 });
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA === scoreB)
    return NextResponse.json({ erro: 'Placar inválido (empate não vale, decide na prorrogação!).' }, { status: 400 });

  const winner = scoreA > scoreB ? 'A' : 'B';
  const teams = db.prepare('SELECT steamid, team FROM lobby_players WHERE code = ?').all(code);

  // BUG CORRIGIDO da v1: elo agora não fica negativo (mínimo 0)
  const K = 25;
  const updElo = db.prepare('UPDATE players SET elo = MAX(0, elo + ?), wins = wins + ?, losses = losses + ? WHERE steamid = ?');
  const tx = db.transaction(() => {
    for (const t of teams) {
      if (!t.team) continue;
      if (t.team === winner) updElo.run(K, 1, 0, t.steamid);
      else updElo.run(-K, 0, 1, t.steamid);
    }
    db.prepare('INSERT INTO matches (code, map, score_a, score_b, winner, teams_json, played_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(code, lobby.decider_map, scoreA, scoreB, winner, JSON.stringify(teams), Date.now());
    db.prepare('UPDATE lobbies SET status = ? WHERE code = ?').run('finalizado', code);
  });
  tx();
  return NextResponse.json({ ok: true });
}
