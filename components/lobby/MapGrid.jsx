'use client';
import MapCard from './MapCard';

// vetoes -> lista do banco; podeBanir -> é a vez de quem está olhando
export default function MapGrid({ maps, vetoes, deciderMap, podeBanir, onBan, nomeDe }) {
  const banidos = Object.fromEntries(vetoes.map(v => [v.map, v]));

  return (
    <div className="mapas">
      {maps.map(m => {
        const ban = banidos[m.id];
        return (
          <MapCard
            key={m.id}
            map={m}
            ban={ban}
            escolhido={deciderMap === m.id}
            banivel={podeBanir && !ban}
            banidoPor={ban ? nomeDe(ban.banned_by) : null}
            onBan={() => onBan(m.id)}
          />
        );
      })}
    </div>
  );
}
