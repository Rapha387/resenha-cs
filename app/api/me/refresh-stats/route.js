// Atualiza stats da Leetify E o nome/avatar da Steam
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { refreshStats } from '@/lib/game';
import { fetchSteamProfile } from '@/lib/steam';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });

  const perfil = await fetchSteamProfile(user.steamid);
  await db.prepare('UPDATE players SET name = ?, avatar = ? WHERE steamid = ?')
    .run(perfil.name, perfil.avatar, user.steamid);
  await refreshStats(user.steamid);

  const fresh = await db.prepare('SELECT * FROM players WHERE steamid = ?').get(user.steamid);
  return NextResponse.json({ user: fresh });
}
