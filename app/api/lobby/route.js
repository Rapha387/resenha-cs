import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { genCode } from '@/lib/game';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  let code = genCode();
  while (await db.prepare('SELECT code FROM lobbies WHERE code = ?').get(code)) code = genCode();
  await db.prepare('INSERT INTO lobbies (code, owner, status, created) VALUES (?, ?, ?, ?)')
    .run(code, user.steamid, 'aguardando', Date.now());
  await db.prepare('INSERT INTO lobby_players (code, steamid, joined) VALUES (?, ?, ?)')
    .run(code, user.steamid, Date.now());
  return NextResponse.json({ code });
}
