'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function ScoreForm({ nomeA, nomeB, onSubmit }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const na = Number.parseInt(a, 10);
  const nb = Number.parseInt(b, 10);
  const preenchido = Number.isInteger(na) && Number.isInteger(nb) && na >= 0 && nb >= 0;
  const empate = preenchido && na === nb;

  function registrar() {
    if (!preenchido || empate) return;
    onSubmit(na, nb);
  }

  return (
    <form className="placar-form" onSubmit={e => { e.preventDefault(); registrar(); }}>
      <div className="placar-linha">
        <label className="placar-lado lado-a">
          <span>Time {nomeA}</span>
          <input type="number" min="0" max="99" placeholder="13"
            value={a} onChange={e => setA(e.target.value)} />
        </label>
        <span className="x" aria-hidden="true">×</span>
        <label className="placar-lado lado-b">
          <span>Time {nomeB}</span>
          <input type="number" min="0" max="99" placeholder="9"
            value={b} onChange={e => setB(e.target.value)} />
        </label>
      </div>
      <Button variante="tr" type="submit" disabled={!preenchido || empate}>Registrar placar</Button>
      {empate ? <p className="fraco">Empate não vale — decide na prorrogação.</p> : null}
    </form>
  );
}
