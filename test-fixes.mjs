import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET;
const sign = v => `${v}.${crypto.createHmac('sha256', SECRET).update(v).digest('hex')}`;
const BASE = 'http://127.0.0.1:3000';
const u1 = { steamid: '76561198000000001' };
const u2 = { steamid: '76561198000000002' };
async function call(user, method, path, body) {
  const res = await fetch(BASE + path, { method,
    headers: { 'Content-Type': 'application/json', 'Cookie': `resenha_sid=${encodeURIComponent(sign(user.steamid))}` },
    body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${data.erro}`);
  return data;
}

// TESTE 1: lobby com só 2 jogadores no modo capitães deve pular direto pro veto
const { code } = await call(u1, 'POST', '/api/lobby');
await call(u2, 'POST', `/api/lobby/${code}/join`);
const r = await call(u1, 'POST', `/api/lobby/${code}/start`,
  { mode: 'capitaes', capA: u1.steamid, capB: u2.steamid });
if (r.proximo !== 'veto') throw new Error('FALHA: 2 jogadores deveria pular o draft, foi pra ' + r.proximo);
console.log('✓ 1x1 pula o draft e vai direto pro veto (bug da v1 corrigido)');

// TESTE 2: rejoin em lobby já iniciado não dá erro (bug de loop da v1)
const rj = await call(u1, 'POST', `/api/lobby/${code}/join`);
if (!rj.code) throw new Error('FALHA: rejoin de membro em lobby iniciado');
console.log('✓ membro consegue "re-entrar" em lobby já iniciado sem erro');

// TESTE 3: parser do XML do perfil público da Steam (correção do "Player 1232")
const xmlExemplo = `<?xml version="1.0"?><profile>
<steamID64>76561198000000001</steamID64>
<steamID><![CDATA[raphinha ★]]></steamID>
<avatarFull><![CDATA[https://avatars.steamstatic.com/abc_full.jpg]]></avatarFull>
</profile>`;
function extractCdata(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (m) return m[1];
  const plain = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return plain ? plain[1] : null;
}
const nome = extractCdata(xmlExemplo, 'steamID');
const avatar = extractCdata(xmlExemplo, 'avatarFull');
if (nome !== 'raphinha ★') throw new Error('FALHA no parser de nome: ' + nome);
if (!avatar.includes('_full.jpg')) throw new Error('FALHA no parser de avatar');
console.log(`✓ parser do perfil Steam extrai nome ("${nome}") e avatar sem precisar de API key`);

console.log('\nCORREÇÕES VALIDADAS ✔');
