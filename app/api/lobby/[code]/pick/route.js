import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const code = params.code.toUpperCase();
  const { steamid } = await request.json().catch(() => ({}));

  const lobby = db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby || lobby.status !== 'draft')
    return NextResponse.json({ erro: 'Não é hora de draft.' }, { status: 400 });
  if (lobby.turn !== user.steamid)
    return NextResponse.json({ erro: 'Não é sua vez de escolher.' }, { status: 403 });

  const target = db.prepare('SELECT * FROM lobby_players WHERE code = ? AND steamid = ?').get(code, steamid);
  if (!target || target.team)
    return NextResponse.json({ erro: 'Jogador indisponível.' }, { status: 400 });

  const myTeam = lobby.turn === lobby.cap_a ? 'A' : 'B';
  db.prepare('UPDATE lobby_players SET team = ? WHERE code = ? AND steamid = ?').run(myTeam, code, steamid);

  const remaining = db.prepare('SELECT COUNT(*) c FROM lobby_players WHERE code = ? AND team IS NULL').get(code).c;
  if (remaining === 0) {
    db.prepare('UPDATE lobbies SET status = ?, turn = ? WHERE code = ?').run('veto', lobby.cap_a, code);
  } else {
    const next = lobby.turn === lobby.cap_a ? lobby.cap_b : lobby.cap_a;
    db.prepare('UPDATE lobbies SET turn = ? WHERE code = ?').run(next, code);
  }
  return NextResponse.json({ ok: true });
}
