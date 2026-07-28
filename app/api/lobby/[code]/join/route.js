import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
export const dynamic = 'force-dynamic';

export function POST(request, { params }) {
  const user = currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const code = params.code.toUpperCase();
  const lobby = db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby) return NextResponse.json({ erro: 'Lobby não encontrado. Confere o código.' }, { status: 404 });

  const already = db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?').get(code, user.steamid);
  if (already) return NextResponse.json({ code }); // já tá dentro: ok (corrige loop de erro da v1)

  if (lobby.status !== 'aguardando')
    return NextResponse.json({ erro: 'A partida já começou nesse lobby.' }, { status: 400 });
  const count = db.prepare('SELECT COUNT(*) c FROM lobby_players WHERE code = ?').get(code).c;
  if (count >= 10) return NextResponse.json({ erro: 'Lobby cheio (10 jogadores).' }, { status: 400 });

  db.prepare('INSERT INTO lobby_players (code, steamid, joined) VALUES (?, ?, ?)')
    .run(code, user.steamid, Date.now());
  return NextResponse.json({ code });
}
