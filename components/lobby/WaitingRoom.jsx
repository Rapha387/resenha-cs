'use client';
import SectionTitle from '@/components/ui/SectionTitle';
import PlayerGrid from './PlayerGrid';
import MatchSetup from './MatchSetup';

export default function WaitingRoom({
  lobby,
  players,
  souDono,
  caps,
  modo,
  onModo,
  onCapitao,
  onIniciar,
  nomeDe,
}) {
  const podeEscolherCapitao = souDono && modo === 'capitaes';

  return (
    <>
      <SectionTitle className="mt" aside={`${players.length}/10`}>Sala de espera</SectionTitle>
      <PlayerGrid
        players={players}
        lobby={lobby}
        caps={caps}
        onSelecionar={podeEscolherCapitao ? onCapitao : null}
      />

      {souDono ? (
        <MatchSetup
          modo={modo}
          onModo={onModo}
          onIniciar={onIniciar}
          capsCompletos={Boolean(caps.a && caps.b)}
          totalJogadores={players.length}
        />
      ) : (
        <p className="fraco centro mt">
          Aguardando <b>{nomeDe(lobby.owner)}</b> iniciar a partida…
        </p>
      )}
    </>
  );
}
