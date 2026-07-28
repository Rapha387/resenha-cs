'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';

// user === undefined -> ainda carregando; null -> deslogado
export function useSession({ onErro } = {}) {
  const [user, setUser] = useState(undefined);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    let vivo = true;
    api('/api/me')
      .then(r => { if (vivo) setUser(r.user ?? null); })
      .catch(() => { if (vivo) setUser(null); });
    return () => { vivo = false; };
  }, []);

  const atualizarStats = useCallback(async () => {
    setAtualizando(true);
    try {
      const { user: fresh } = await api('/api/me/refresh-stats', { method: 'POST' });
      setUser(fresh);
    } catch (e) {
      onErro?.(e.message);
    } finally {
      setAtualizando(false);
    }
  }, [onErro]);

  const sair = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      onErro?.(e.message);
    }
    setUser(null);
  }, [onErro]);

  return { user, carregando: user === undefined, atualizando, atualizarStats, sair };
}
