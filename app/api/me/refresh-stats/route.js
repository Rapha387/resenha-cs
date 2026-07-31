// Atualiza stats da Leetify E o nome/avatar da Steam.
import { db } from '@/lib/db';
import { refreshStats } from '@/lib/leetify';
import { fetchSteamProfile } from '@/lib/steam';
import { rotaAutenticada } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

export const POST = rotaAutenticada(async ({ user }) => {
  const perfil = await fetchSteamProfile(user.steamid);
  await db.prepare('UPDATE players SET name = ?, avatar = ? WHERE steamid = ?')
    .run(perfil.name, perfil.avatar, user.steamid);
  await refreshStats(user.steamid);

  const atualizado = await db.prepare('SELECT * FROM players WHERE steamid = ?').get(user.steamid);
  return { user: atualizado };
});
