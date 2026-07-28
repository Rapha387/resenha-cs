// Placar ao vivo: proxy pro backend dedicado (que recebe os eventos do CS2
// via Resenha Client). A chave interna fica só no servidor, nunca no browser.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { liveState, backendConfigurado } from '@/lib/backend';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  if (!backendConfigurado()) return NextResponse.json({ live: null });

  const code = params.code.toUpperCase();
  // Só quem está no lobby vê as stats ao vivo da galera.
  const dentro = await db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?')
    .get(code, user.steamid);
  if (!dentro) return NextResponse.json({ erro: 'Você não está nesse lobby.' }, { status: 403 });

  return NextResponse.json({ live: await liveState(code) });
}
