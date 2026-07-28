// lib/baseUrl.js — descobre o endereço público do site.
//
// O login da Steam exige que o realm/return_to batam EXATAMENTE com o domínio
// que o jogador está usando no navegador. Derivar do próprio request evita o
// caso clássico na Vercel: VERCEL_URL aponta pro domínio único do deploy
// (resenha-abc123.vercel.app), então o cookie de sessão era gravado nesse
// domínio e o jogador voltava "deslogado" pro domínio de verdade.
//
// BASE_URL continua sendo respeitada e tem prioridade, pra quem quiser fixar
// um endereço (túnel do Cloudflare, IP de VPN, domínio próprio).
export function baseUrl(request) {
  const fixo = process.env.BASE_URL;
  if (fixo) {
    const limpo = fixo.trim().replace(/\/$/, '');
    // Sem protocolo a Steam recusa o login com "Invalid return protocol".
    if (/^https?:\/\//.test(limpo)) return limpo;
    const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(limpo);
    return `${local ? 'http' : 'https'}://${limpo}`;
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (host) {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const proto = request.headers.get('x-forwarded-proto') || (local ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}
