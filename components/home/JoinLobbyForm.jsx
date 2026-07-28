'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import CodeInput from '@/components/ui/CodeInput';

export default function JoinLobbyForm({ onEntrar }) {
  const [codigo, setCodigo] = useState('');
  const pronto = codigo.trim().length > 0;

  function entrar() {
    if (!pronto) return;
    onEntrar(codigo.trim().toUpperCase());
  }

  return (
    <div className="entrar-lobby">
      <CodeInput value={codigo} onChange={setCodigo} onEnter={entrar} />
      <Button variante="ct" onClick={entrar} disabled={!pronto}>Entrar</Button>
    </div>
  );
}
