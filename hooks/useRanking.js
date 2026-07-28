'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

// ranking === null -> carregando
export function useRanking() {
  const [ranking, setRanking] = useState(null);

  useEffect(() => {
    let vivo = true;
    api('/api/ranking')
      .then(r => { if (vivo) setRanking(r.ranking || []); })
      .catch(() => { if (vivo) setRanking([]); });
    return () => { vivo = false; };
  }, []);

  return { ranking, carregando: ranking === null };
}
