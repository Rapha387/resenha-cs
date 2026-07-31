// lib/rotas.js — o que toda rota de API repetia: exigir login, normalizar o
// código do lobby, carregar o lobby e cobrar o estado certo.
//
// Antes cada uma das 9 rotas abria com o mesmo bloco de currentUser() + 401.
// Aqui isso vira um envelope: o handler só roda quando já existe usuário, e
// erros viram resposta JSON sem try/catch espalhado.
import { NextResponse } from 'next/server';
import { db } from './db';
import { currentUser } from './session';

/** Erro que a rota sabe transformar em resposta (em vez de estourar 500). */
class ErroDeRota extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export const erro = (status, mensagem) => new ErroDeRota(status, mensagem);

/**
 * Envelopa um handler de rota autenticada.
 *
 *   export const POST = rotaAutenticada(async ({ user, code, request }) => {...})
 *
 * O handler recebe o usuário logado e o código do lobby já em maiúsculas, e
 * devolve o objeto de resposta (ou um NextResponse, se precisar de controle).
 */
export function rotaAutenticada(handler) {
  return async (request, contexto) => {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
    }

    const code = contexto?.params?.code
      ? String(contexto.params.code).toUpperCase()
      : null;

    try {
      const resposta = await handler({ user, code, request, params: contexto?.params });
      return resposta instanceof NextResponse ? resposta : NextResponse.json(resposta ?? { ok: true });
    } catch (e) {
      if (e instanceof ErroDeRota) {
        return NextResponse.json({ erro: e.message }, { status: e.status });
      }
      throw e;
    }
  };
}

/** Corpo JSON da requisição, tolerante a corpo vazio ou inválido. */
export const corpoJson = (request) => request.json().catch(() => ({}));

/**
 * Carrega o lobby exigindo um estado específico do fluxo.
 * `estado` aceita string ou lista — o erro cita o que a tela deveria mostrar.
 */
export async function carregarLobby(code, estado, mensagemErro) {
  const lobby = await db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby) throw erro(404, 'Lobby não encontrado.');
  if (!estado) return lobby;

  const aceitos = Array.isArray(estado) ? estado : [estado];
  if (!aceitos.includes(lobby.status)) {
    throw erro(400, mensagemErro ?? 'O lobby não está nesse estado.');
  }
  return lobby;
}
