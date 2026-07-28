import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { genCode } from '@/lib/game';
export const dynamic = 'force-dynamic';

export function POST() {
  const user = currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  let code = genCode();
  while (db.prepare('SELECT code FROM lobbies WHERE code = ?').get(code)) code = genCode();
  db.prepare('INSERT INTO lobbies (code, owner, status, created) VALUES (?, ?, ?, ?)')
    .run(code, user.steamid, 'aguardando', Date.now());
  db.prepare('INSERT INTO lobby_players (code, steamid, joined) VALUES (?, ?, ?)')
    .run(code, user.steamid, Date.now());
  return NextResponse.json({ code });
}
