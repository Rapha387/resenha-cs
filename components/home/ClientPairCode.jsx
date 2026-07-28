'use client';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/client';

// Gera o código de conexão do Resenha Client (app desktop) e mostra com
// contagem regressiva. O usuário digita esse código no app uma única vez.
export default function ClientPairCode() {
  const [codigo, setCodigo] = useState(null); // { code, expires }
  const [restante, setRestante] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const data = await api('/api/client/pair-code', { method: 'POST' });
      setCodigo(data);
      clearInterval(timer.current);
      timer.current = setInterval(() => {
        const resta = Math.max(0, Math.round((data.expires - Date.now()) / 1000));
        setRestante(resta);
        if (resta === 0) {
          clearInterval(timer.current);
          setCodigo(null);
        }
      }, 250);
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="mt-sm">
      {codigo ? (
        <>
          <div className="codigo-lobby">
            <span className="rotulo">Resenha Client</span>
            <b>{codigo.code}</b>
            <span className="fraco">
              expira em {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}
            </span>
          </div>
          <p className="fraco">Digite esse código no Resenha Client pra conectar o CS2.</p>
        </>
      ) : (
        <>
          <Button tamanho="sm" variante="fantasma" onClick={gerar} disabled={gerando}>
            {gerando ? 'Gerando…' : '🖥️ Conectar Resenha Client'}
          </Button>
          {erro ? <p className="fraco">{erro}</p> : null}
        </>
      )}
    </div>
  );
}
