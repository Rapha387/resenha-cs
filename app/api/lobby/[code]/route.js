import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/session';
import { lobbyState } from '@/lib/game';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const state = await lobbyState(params.code.toUpperCase());
  if (!state) return NextResponse.json({ erro: 'Lobby não encontrado.' }, { status: 404 });
  return NextResponse.json(state);
}
