// Valida o retorno da Steam, cria/atualiza o jogador e abre a sessão
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sign, COOKIE_NAME, cookieOptions } from '@/lib/session';
import { fetchSteamProfile } from '@/lib/steam';
import { refreshStats } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const BASE_URL = (process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '');
  try {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.searchParams);
    params.set('openid.mode', 'check_authentication');

    console.log('Steam return callback', {
      baseUrl: BASE_URL,
      return_to: url.searchParams.get('openid.return_to'),
      claimed_id: url.searchParams.get('openid.claimed_id'),
      mode: url.searchParams.get('openid.mode'),
      assoc_handle: url.searchParams.get('openid.assoc_handle'),
    });

    const verify = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      cache: 'no-store',
    });
    const text = await verify.text();
    if (!verify.ok) {
      console.error('Steam OpenID verify HTTP error', verify.status, text);
      return new NextResponse('Erro ao verificar o login Steam.', { status: 502 });
    }
    if (!text.includes('is_valid:true')) {
      console.error('Steam OpenID verify invalid response', text);
      return new NextResponse('Login Steam inválido. Volte e tente novamente.', { status: 403 });
    }

    const claimed = url.searchParams.get('openid.claimed_id') || '';
    const match = claimed.match(/\/id\/(\d{17})$/);
    if (!match) return new NextResponse('SteamID não encontrado.', { status: 403 });
    const steamid = match[1];

    // nome e avatar de verdade (com ou sem STEAM_API_KEY)
    const perfil = await fetchSteamProfile(steamid);

    const exists = db.prepare('SELECT steamid FROM players WHERE steamid = ?').get(steamid);
    if (exists) {
      db.prepare('UPDATE players SET name = ?, avatar = ? WHERE steamid = ?')
        .run(perfil.name, perfil.avatar, steamid);
    } else {
      db.prepare('INSERT INTO players (steamid, name, avatar, created) VALUES (?, ?, ?, ?)')
        .run(steamid, perfil.name, perfil.avatar, Date.now());
    }

    refreshStats(steamid); // Leetify em segundo plano, não trava o login

    console.log('Steam login success', { steamid, userExists: !!exists });

    const res = NextResponse.redirect(BASE_URL + '/');
    res.cookies.set(COOKIE_NAME, sign(steamid), cookieOptions);
    return res;
  } catch (err) {
    console.error('Erro no retorno da Steam:', err);
    return new NextResponse('Erro no login. Tente novamente.', { status: 500 });
  }
}
