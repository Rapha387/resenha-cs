'use client';
import { cx } from '@/lib/cx';

// Código de lobby: 5 caracteres, sempre maiúsculo, Enter confirma.
export default function CodeInput({ value, onChange, onEnter, className = '', ...resto }) {
  return (
    <input
      type="text"
      inputMode="latin"
      autoComplete="off"
      spellCheck={false}
      maxLength={5}
      placeholder="CÓDIGO"
      aria-label="Código do lobby"
      className={cx('input-codigo', className)}
      value={value}
      onChange={e => onChange(e.target.value.toUpperCase())}
      onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
      {...resto}
    />
  );
}
