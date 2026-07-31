import { lobbyState } from '@/lib/lobby';
import { rotaAutenticada, erro } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

export const GET = rotaAutenticada(async ({ code }) => {
  const estado = await lobbyState(code);
  if (!estado) throw erro(404, 'Lobby não encontrado.');
  return estado;
});
