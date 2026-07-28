import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { fixGenericNames } from '@/lib/steam';
export const dynamic = 'force-dynamic';

// Na primeira chamada após o servidor subir, conserta em segundo plano
// jogadores que ficaram com nome genérico "Player XXXX" (bug da v1)
let consertou = false;

export function GET() {
  if (!consertou) {
    consertou = true;
    fixGenericNames(db).catch(() => {});
  }
  return NextResponse.json({ user: currentUser() });
}
