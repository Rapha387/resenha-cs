'use client';
import PlayerCard from '@/components/player/PlayerCard';
import SectionTitle from '@/components/ui/SectionTitle';
import TeamColumn from './TeamColumn';

// onPick != null -> o banco fica clicável (draft, na vez do capitão)
export default function TeamsBoard({ lobby, players, nomeDe, onPick = null }) {
  const timeA = players.filter(p => p.team === 'A');
  const timeB = players.filter(p => p.team === 'B');
  const banco = players.filter(p => !p.team);

  return (
    <div>
      <div className="times">
        <TeamColumn lado="a" titulo={nomeDe(lobby.cap_a)} jogadores={timeA} capitao={lobby.cap_a} />
        <div className="vs" aria-hidden="true">VS</div>
        <TeamColumn lado="b" titulo={nomeDe(lobby.cap_b)} jogadores={timeB} capitao={lobby.cap_b} />
      </div>

      {banco.length > 0 && (
        <div className="mt">
          <SectionTitle aside={`${banco.length} na fila`}>Disponíveis</SectionTitle>
          <div className="lista-grade">
            {banco.map(p => (
              <PlayerCard
                key={p.steamid}
                player={p}
                acao={onPick ? 'escolher' : null}
                onClick={onPick ? () => onPick(p.steamid) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
