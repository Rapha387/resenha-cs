// Gera o código de conexão do Resenha Client (app desktop).
// O usuário loga aqui com a Steam, gera o código e digita no app — o backend
// dedicado troca o código pelos tokens em POST /api/client/auth/pair,
// validando nesta mesma tabela (banco compartilhado).
import { db } from '@/lib/db';
import { gerarCodigo, TAMANHO_CODIGO_PAREAMENTO } from '@/lib/codigos';
import { rotaAutenticada } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

const TTL_MS = 5 * 60 * 1000; // expira em 5 minutos
const TENTATIVAS = 5;

const genPairCode = () => gerarCodigo(TAMANHO_CODIGO_PAREAMENTO);

export const POST = rotaAutenticada(async ({ user }) => {
  const agora = Date.now();

  // Limpeza: códigos expirados/usados de qualquer usuário, e códigos ainda
  // válidos deste usuário (só o mais novo vale — evita acumular código vivo).
  await db.batch([
    { sql: 'DELETE FROM client_pair_codes WHERE expires < ? OR used = 1', args: [agora] },
    { sql: 'DELETE FROM client_pair_codes WHERE steamid = ?', args: [user.steamid] },
  ]);

  // PRIMARY KEY garante unicidade; colisão em 32^6 é raríssima, mas se rolar
  // tentamos outro código.
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const code = genPairCode();
    try {
      await db.prepare(
        'INSERT INTO client_pair_codes (code, steamid, expires, used, created) VALUES (?, ?, ?, 0, ?)'
      ).run(code, user.steamid, agora + TTL_MS, agora);
      return { code, expires: agora + TTL_MS };
    } catch (e) {
      if (tentativa === TENTATIVAS) throw e;
    }
  }
});
