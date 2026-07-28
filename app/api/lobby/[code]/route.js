import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/session';
import { lobbyState } from '@/lib/game';
export const dynamic = 'force-dynamic';

export function GET(request, { params }) {
  const user = currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const state = lobbyState(params.code.toUpperCase());
  if (!state) return NextResponse.json({ erro: 'Lobby não encontrado.' }, { status: 404 });
  return NextResponse.json(state);
}
