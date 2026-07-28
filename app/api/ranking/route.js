import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.prepare(`
    SELECT steamid, name, avatar, elo, wins, losses, premier, leetify_rating
    FROM players WHERE wins + losses > 0 OR elo != 1000
    ORDER BY elo DESC, wins DESC LIMIT 50`).all();
  return NextResponse.json({ ranking: rows });
}
