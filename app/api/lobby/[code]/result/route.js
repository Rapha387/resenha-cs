import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const code = params.code.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const scoreA = parseInt(body.scoreA, 10);
  const scoreB = parseInt(body.scoreB, 10);

  const lobby = await db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby || lobby.status !== 'pronto')
    return NextResponse.json({ erro: 'A partida ainda não está pronta.' }, { status: 400 });
  if (lobby.owner !== user.steamid)
    return NextResponse.json({ erro: 'Só quem criou o lobby registra o placar.' }, { status: 403 });
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA === scoreB)
    return NextResponse.json({ erro: 'Placar inválido (empate não vale, decide na prorrogação!).' }, { status: 400 });

  const winner = scoreA > scoreB ? 'A' : 'B';
  const teams = await db.prepare('SELECT steamid, team FROM lobby_players WHERE code = ?').all(code);

  // BUG CORRIGIDO da v1: elo agora não fica negativo (mínimo 0)
  const K = 25;
  const updElo = 'UPDATE players SET elo = MAX(0, elo + ?), wins = wins + ?, losses = losses + ? WHERE steamid = ?';
  const statements = teams
    .filter(t => t.team)
    .map(t => ({
      sql: updElo,
      args: t.team === winner ? [K, 1, 0, t.steamid] : [-K, 0, 1, t.steamid],
    }));
  statements.push({
    sql: 'INSERT INTO matches (code, map, score_a, score_b, winner, teams_json, played_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [code, lobby.decider_map, scoreA, scoreB, winner, JSON.stringify(teams), Date.now()],
  });
  statements.push({
    sql: 'UPDATE lobbies SET status = ? WHERE code = ?',
    args: ['finalizado', code],
  });
  await db.batch(statements);
  return NextResponse.json({ ok: true });
}
