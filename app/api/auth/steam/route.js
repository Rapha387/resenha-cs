// Redireciona pro login OpenID da Steam
import { NextResponse } from 'next/server';
import { baseUrl } from '@/lib/baseUrl';
export const dynamic = 'force-dynamic';

export function GET(request) {
  const BASE_URL = baseUrl(request);
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${BASE_URL}/api/auth/steam/return`,
    'openid.realm': BASE_URL,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  return NextResponse.redirect(`https://steamcommunity.com/openid/login?${params}`);
}
