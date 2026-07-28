'use client';
import PlayerCard from '@/components/player/PlayerCard';
import Tag from '@/components/ui/Tag';

// Grade da sala de espera: marca o dono e os capitães escolhidos.
export default function PlayerGrid({ players, lobby, caps = { a: null, b: null }, onSelecionar = null }) {
  return (
    <div className="lista-grade">
      {players.map(p => {
        const tags = [];
        if (p.steamid === lobby.owner) tags.push(<Tag key="dono" tom="dono">dono</Tag>);
        if (caps.a === p.steamid) tags.push(<Tag key="capa" tom="capitao">CAP A</Tag>);
        if (caps.b === p.steamid) tags.push(<Tag key="capb" tom="capitao">CAP B</Tag>);

        return (
          <PlayerCard
            key={p.steamid}
            player={p}
            tags={tags}
            destaque={caps.a === p.steamid ? 'a' : caps.b === p.steamid ? 'b' : null}
            acao={onSelecionar ? 'capitão' : null}
            onClick={onSelecionar ? () => onSelecionar(p.steamid) : undefined}
          />
        );
      })}
    </div>
  );
}
