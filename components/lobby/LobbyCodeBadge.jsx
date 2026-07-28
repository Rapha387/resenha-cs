'use client';
import { useEffect, useRef, useState } from 'react';

// Mostra o código e copia o link de convite (o que a galera realmente precisa colar no grupo).
export default function LobbyCodeBadge({ code }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard bloqueado (http sem localhost): o código na tela resolve
      window.prompt('Copie o link do lobby:', window.location.href);
    }
  }

  return (
    <div className="codigo-lobby">
      <span className="rotulo">Lobby</span>
      <b>{code}</b>
      <button type="button" className="btn btn-sm btn-fantasma" onClick={copiar}>
        {copiado ? '✓ copiado' : 'copiar link'}
      </button>
    </div>
  );
}
