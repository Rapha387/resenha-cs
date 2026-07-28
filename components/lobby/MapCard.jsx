'use client';
import { cx } from '@/lib/cx';

export default function MapCard({ map, ban, escolhido, banivel, onBan, banidoPor }) {
  return (
    <div
      className={cx('mapa', ban && 'banido', escolhido && 'escolhido', banivel && 'banivel')}
      onClick={banivel ? onBan : undefined}
      role={banivel ? 'button' : undefined}
      tabIndex={banivel ? 0 : undefined}
      aria-label={banivel ? `Banir ${map.nome}` : undefined}
      onKeyDown={banivel ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBan(); }
      } : undefined}
    >
      <span className="codinome">{map.id}</span>
      <div className="nome">{map.nome}</div>

      {ban ? (
        <>
          <div className="carimbo"><span>Banido</span></div>
          <div className="ordem">#{ban.ord}</div>
          <div className="banido-por">por {banidoPor}</div>
        </>
      ) : null}
    </div>
  );
}
